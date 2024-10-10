using P2PChat.Server.Hubs;

namespace P2PChat.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            //builder.Services.AddAuthorization();
            builder.Services.AddSignalR();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Permissions", policy =>
                {
                    policy.AllowAnyHeader().AllowAnyMethod().WithOrigins(@"https://localhost:5173").AllowCredentials();
                });
            });
            var app = builder.Build();
            
            app.UseCors("Permissions");
            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Configure the HTTP request pipeline.

            app.UseHttpsRedirection();
            //app.UseAuthorization();
           
            app.UseRouting();
            app.MapHub<SignalHub>("/signal");
            app.MapFallbackToFile("/index.html");
            app.Run();
        }
    }
}
