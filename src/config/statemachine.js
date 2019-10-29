 import { MessageType } from "../config/messagesConstants";

 // WIP: These are notes for possible structures for the state machine
 // These proposals are not final and may be changed at any time.

 const messageManager = messages => {
   const requestsQueue = {};
//    const idsDic = getMessagesIdsMap  
   // A request object will be the next
      const req = {
       message: 123, //Object,
        requests: [] // Contains the message to send
     }

   messages.forEach(msg => {
     // Ids dict is a map used to search the Payment_ID and make sure we have the message
     // If we don't have the id no further processing is required.
      const idsDic = {}
     // if(!idsDic[m.payment_id]) return null;
     // We also have to check if the message was already sent, and IS NOT in the queue
     //
     // if(idDic[m.payment_id][msgNumber] ||
     //   msgQueueMap[m._payment_id] && msgQueueMap[m._payment_id][m.msgNumber]) return null;
     const { type } = msg;
     if (type) {
       return addToQueue(msg, type, requestsQueue);
     }
   });
 };

 const addToQueue = (msg, type, queue) => {
   switch (type) {
     case MessageType.DELIVERED:
     case MessageType.PROCESSED:
     case MessageType.LOCKED_TRANSFER:
       // Pack the data and sign it
     case MessageType.SECRET_REQUEST:
       // Prepare a delivered
       // Prepare a secret with the secret that was stored
     case MessageType.SECRET_REVEAL:

   }
 };
