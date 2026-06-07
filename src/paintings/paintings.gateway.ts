import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

interface SocketAuthentication {
  value?: unknown;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PaintingsGateway {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  private readonly server: Server;

  handlePaintingUpdated() {
    this.server.emit('Painting updated');
  }

  handleConnection(client: Socket) {
    try {
      const authentication = client.handshake.auth
        .Authentication as SocketAuthentication;

      if (typeof authentication?.value !== 'string') {
        client.disconnect();
        return;
      }

      this.authService.verifyToken(authentication.value);
    } catch (error) {
      console.error('Unauthorized connection attempt', error);
      client.disconnect();
    }
  }
}
