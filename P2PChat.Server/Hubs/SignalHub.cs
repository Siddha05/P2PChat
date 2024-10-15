using Microsoft.AspNetCore.SignalR;
using P2PChat.Server.Models;
using System.Text.Json;

namespace P2PChat.Server.Hubs
{
    public class SignalHub : Hub
    {
        ILogger<SignalHub> _logger;


        //Для поддержки множества пользователей для их попарного соединения необходимо хранить информацию о пользователях и их ConnectionID
        //предполагаем, что у нас могут присоединиться только 2 и не храним никакой информации
        public async Task NewUser(string user)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "SweetPair");
            await Clients.OthersInGroup("SweetPair").SendAsync("on_user_add", user);
            _logger.LogInformation($"User connected {user}");
        }


        public async Task SendSignal(string signal)
        {
            _logger.LogWarning($"Got signal {signal}");
            await Clients.OthersInGroup("SweetPair").SendAsync("on_signal", signal);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            await Clients.Caller.SendAsync("on_connected", Context.ConnectionId);
        }

        public SignalHub(ILogger<SignalHub> loger) => _logger = loger;
    }
}
