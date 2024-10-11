using Microsoft.AspNetCore.SignalR;
using P2PChat.Server.Models;
using System.Text.Json;

namespace P2PChat.Server.Hubs
{
    public class SignalHub : Hub
    {
        ILogger<SignalHub> _logger;

        public async Task NewUser(string username)
        {
            var user = new ChatUser { Name = username, ConnectionID = Context.ConnectionId };
            await Groups.AddToGroupAsync(Context.ConnectionId, "1122");
            await Clients.OthersInGroup("1122").SendAsync("on_user_add", JsonSerializer.Serialize(user));
            _logger.LogInformation($"User connected {username} {Context.ConnectionId}");
        }


        public async Task SendSignal(string signal, string target)
        {
            _logger.LogWarning($"Got signal {signal} for {target}");
            await Clients.Clients(target).SendAsync("on_signal", signal);
        }

        public SignalHub(ILogger<SignalHub> loger) => _logger = loger;
    }
}
