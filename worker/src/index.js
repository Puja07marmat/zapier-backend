"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const client_1 = require("@prisma/client");
const kafkajs_1 = require("kafkajs");
const parser_1 = require("./parser");
const email_1 = require("./email");
const solana_1 = require("./solana");
const prismaClient = new client_1.PrismaClient();
const TOPIC_NAME = "zap-events";
const kafka = new kafkajs_1.Kafka({
    clientId: 'outbox-processor-2',
    brokers: ['localhost:9092']
});
async function main() {
    const consumer = kafka.consumer({ groupId: 'main-worker-2' });
    await consumer.connect();
    const producer = kafka.producer();
    await producer.connect();
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                partition,
                offset: message.offset,
                value: message.value?.toString(),
            });
            if (!message.value?.toString()) {
                return;
            }
            const parsedValue = JSON.parse(message.value?.toString());
            const zapRunId = parsedValue.zapRunId;
            const stage = parsedValue.stage;
            const zapRunDetails = await prismaClient.zapRun.findFirst({
                where: {
                    id: zapRunId
                },
                include: {
                    zap: {
                        include: {
                            actions: {
                                include: {
                                    type: true
                                }
                            }
                        }
                    },
                }
            });
            const currentAction = zapRunDetails?.zap.actions.find(x => x.sortingOrder === stage);
            if (!currentAction) {
                console.log("Current action not found?");
                return;
            }
            const zapRunMetadata = zapRunDetails?.metadata;
            if (currentAction.type.id === "email") {
                const body = (0, parser_1.parse)(currentAction.metadata?.body, zapRunMetadata);
                const to = (0, parser_1.parse)(currentAction.metadata?.email, zapRunMetadata);
                console.log(`Sending out email to ${to} body is ${body}`);
                await (0, email_1.sendEmail)(to, body);
            }
            if (currentAction.type.id === "send-sol") {
                const amount = (0, parser_1.parse)(currentAction.metadata?.amount, zapRunMetadata);
                const address = (0, parser_1.parse)(currentAction.metadata?.address, zapRunMetadata);
                console.log(`Sending out SOL of ${amount} to address ${address}`);
                await (0, solana_1.sendSol)(address, amount);
            }
            // 
            await new Promise(r => setTimeout(r, 500));
            const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // 1
            console.log(lastStage);
            console.log(stage);
            if (lastStage !== stage) {
                console.log("pushing back to the queue");
                await producer.send({
                    topic: TOPIC_NAME,
                    messages: [{
                            value: JSON.stringify({
                                stage: stage + 1,
                                zapRunId
                            })
                        }]
                });
            }
            console.log("processing done");
            // 
            await consumer.commitOffsets([{
                    topic: TOPIC_NAME,
                    partition: partition,
                    offset: (parseInt(message.offset) + 1).toString() // 5
                }]);
        },
    });
}
main();
