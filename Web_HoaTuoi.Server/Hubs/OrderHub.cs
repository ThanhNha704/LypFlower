using Microsoft.AspNetCore.SignalR;

namespace Web_HoaTuoi.Server.Hubs;

public class OrderHub : Hub
{
    // Clients có thể gọi các phương thức ở đây nếu cần,
    // nhưng trong trường hợp này Server sẽ chủ động push (SendAsync) cho Clients.
}
