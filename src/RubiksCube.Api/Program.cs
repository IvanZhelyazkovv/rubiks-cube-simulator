using RubiksCube.Api.Infrastructure;
using RubiksCube.Application.Scrambling;
using RubiksCube.Application.Sessions;
using RubiksCube.Application.UseCases;

const string FrontendDevCorsPolicy = "frontend-dev";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Domain and application exceptions become RFC 9457 problem-details responses.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

// Composition: the in-memory adapter satisfies the application's session port,
// and the stateless use cases are registered as-is.
builder.Services.AddSingleton<ICubeSessionRepository, InMemoryCubeSessionRepository>();
builder.Services.AddSingleton<ScrambleGenerator>();
builder.Services.AddSingleton<CreateCubeUseCase>();
builder.Services.AddSingleton<GetCubeUseCase>();
builder.Services.AddSingleton<ApplyMovesUseCase>();
builder.Services.AddSingleton<UndoLastMoveUseCase>();
builder.Services.AddSingleton<ResetCubeUseCase>();
builder.Services.AddSingleton<ScrambleCubeUseCase>();
builder.Services.AddSingleton<DeleteCubeUseCase>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    foreach (var xmlFile in (string[])["RubiksCube.Api.xml", "RubiksCube.Application.xml"])
    {
        var path = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(path))
        {
            options.IncludeXmlComments(path);
        }
    }
});

// During development the web UI runs on Vite's dev server and calls this API
// cross-origin; in production it is served from wwwroot, same origin.
builder.Services.AddCors(options => options.AddPolicy(
    FrontendDevCorsPolicy,
    policy => policy
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors(FrontendDevCorsPolicy);
}

// The built web UI is served as static files, with client-side routing falling
// back to index.html.
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

/// <summary>
/// Exposes the implicit entry-point class to integration tests
/// (<c>WebApplicationFactory&lt;Program&gt;</c>).
/// </summary>
public partial class Program
{
}
