import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { ChatMessage } from "./models/chat-message.model";

@WebSocketGateway({
  cors: {
    origin: '*', // для dev
    credentials: true,
  },
  namespace: '/ws/chat'
})
export class SupportChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  sendToParticipants(clientId: string, message: ChatMessage) {
    this.server.to(clientId).emit('new-message', message);
  }

  handleConnection(client: Socket) {
    const clientId = client.handshake.auth.clientId;

    if (!clientId) {
      client.disconnect();
      return;
    }

    client.join(clientId);

    console.log(
      `Client ${client.id} connected to /chat with clientId=${clientId}`,
    );
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected ${client.id}`);
  }


}