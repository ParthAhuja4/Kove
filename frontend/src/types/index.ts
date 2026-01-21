export interface User {
    _id: string;
    name: string;
    email: string;
  }
  
  export interface Message {
    _id: string;
    chatId: string;
    sender: string;
    text: string;
    messageType: 'text' | 'image';
    image?: {
      url: string;
      publicId: string;
    };
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Chat {
    _id: string;
  
    latestMessage?: {
      text: string;
      sender: string;
    };
    user: User;
    unseenCount: number;
  }
  