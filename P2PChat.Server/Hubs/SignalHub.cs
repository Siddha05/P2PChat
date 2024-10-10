using Microsoft.AspNetCore.SignalR;
using P2PChat.Server.Models;
using System.Text.Json;

namespace P2PChat.Server.Hubs
{
    public class SignalHub : Hub
    {
        ILogger<SignalHub> _logger;
        static List<ChatUser> _users = new();

        public async Task NewUser(string username)
        {
            if (_users.Count < 2)//Assume only 2 user
            {
                _users.Add(new ChatUser { Name = username, ConnectionID = Context.ConnectionId });
                await Clients.Others.SendAsync("on_user_add", username);
                _logger.LogInformation($"User connected {username} {Context.ConnectionId}. Total {_users.Count}");
                if (_users.Count is 2 )
                {
                    await SendReadyToConnect(_users[0].ConnectionID);
                }
            }
            else
            {
                _logger.LogInformation("Already full users list");
            }
        }

        private async Task SendReadyToConnect(string target) => await Clients.User(target).SendAsync("on_ready");

        public async Task SendSignal(string signal, string target)
        {
            _logger.LogWarning($"Got signal {signal}");
            await Clients.User(target).SendAsync("on_signal" , signal);
        }

        public SignalHub(ILogger<SignalHub> loger) => _logger = loger;
    }
}
