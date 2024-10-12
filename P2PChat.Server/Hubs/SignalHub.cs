using Microsoft.AspNetCore.SignalR;
using P2PChat.Server.Models;
using System.Text.Json;

namespace P2PChat.Server.Hubs
{
    public class SignalHub : Hub
    {
        ILogger<SignalHub> _logger;

        public async Task NewUser(string user)
        {
            //var user = new ChatUser { Name = user, ConnectionID = Context.ConnectionId };
            await Groups.AddToGroupAsync(Context.ConnectionId, "1122");
            await Clients.OthersInGroup("1122").SendAsync("on_user_add", user);
            _logger.LogInformation($"User connected {user}");
        }


        public async Task SendSignal(string signal)
        {
            _logger.LogWarning($"Got signal {signal}");
            await Clients.OthersInGroup("1122").SendAsync("on_signal", signal);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            await Clients.Caller.SendAsync("on_connected", Context.ConnectionId);
        }

        public SignalHub(ILogger<SignalHub> loger) => _logger = loger;
    }
}
