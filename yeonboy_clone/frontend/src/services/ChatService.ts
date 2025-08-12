import firestore from '@react-native-firebase/firestore';
import { Chat, Message } from '../types';

const CHATS_COLLECTION = 'chats';

export const ChatService = {
  /**
   * Fetches all chats for a given user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of Chat objects.
   */
  async getChats(userId: string): Promise<Chat[]> {
    const snapshot = await firestore()
      .collection(CHATS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  },

  /**
   * Creates a new chat.
   * @param userId The ID of the user creating the chat.
   * @param initialMessage An optional initial message for the chat.
   * @returns A promise that resolves to the newly created Chat object.
   */
  async createChat(userId: string, initialMessage?: Message): Promise<Chat> {
    const newChatRef = firestore().collection(CHATS_COLLECTION).doc();
    const newChat: Chat = {
      id: newChatRef.id,
      userId,
      messages: initialMessage ? [initialMessage] : [],
      createdAt: firestore.FieldValue.serverTimestamp() as any, // Firestore timestamp
      updatedAt: firestore.FieldValue.serverTimestamp() as any, // Firestore timestamp
    };
    await newChatRef.set(newChat);
    return newChat;
  },

  /**
   * Adds a message to an existing chat.
   * @param chatId The ID of the chat to add the message to.
   * @param message The message to add.
   * @returns A promise that resolves when the message is added.
   */
  async addMessageToChat(chatId: string, message: Message): Promise<void> {
    const chatRef = firestore().collection(CHATS_COLLECTION).doc(chatId);
    await chatRef.update({
      messages: firestore.FieldValue.arrayUnion(message),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  /**
   * Updates the status of a specific message within a chat.
   * This might be more complex as Firestore doesn't directly support updating elements within an array by a specific field.
   * A common approach is to fetch the array, update it in memory, and then save the entire array back.
   * @param chatId The ID of the chat containing the message.
   * @param messageId The ID of the message to update.
   * @param status The new status for the message.
   * @returns A promise that resolves when the message status is updated.
   */
  async updateMessageStatus(chatId: string, messageId: string, status: Message['status']): Promise<void> {
    const chatRef = firestore().collection(CHATS_COLLECTION).doc(chatId);
    const chatDoc = await chatRef.get();
    if (chatDoc.exists) {
      const chatData = chatDoc.data() as Chat;
      const updatedMessages = chatData.messages.map(msg =>
        msg.messageId === messageId ? { ...msg, status } : msg
      );
      await chatRef.update({
        messages: updatedMessages,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      throw new Error(`Chat with ID ${chatId} not found.`);
    }
  },

  /**
   * Deletes a chat.
   * @param chatId The ID of the chat to delete.
   * @returns A promise that resolves when the chat is deleted.
   */
  async deleteChat(chatId: string): Promise<void> {
    await firestore().collection(CHATS_COLLECTION).doc(chatId).delete();
  },
};