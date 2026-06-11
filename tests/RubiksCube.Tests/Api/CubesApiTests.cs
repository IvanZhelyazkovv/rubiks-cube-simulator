using System.Net;
using System.Net.Http.Json;

using Microsoft.AspNetCore.Mvc.Testing;

using RubiksCube.Application.Dtos;

namespace RubiksCube.Tests.Api;

/// <summary>
/// End-to-end HTTP tests covering the full request pipeline: routing, model binding,
/// use cases, the in-memory store and problem-details error mapping.
/// </summary>
public sealed class CubesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CubesApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateCube_ReturnsCreatedSolvedCube()
    {
        var response = await _client.PostAsJsonAsync("/api/cubes", new { });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();
        Assert.NotNull(cube);
        Assert.Equal(3, cube.Size);
        Assert.True(cube.IsSolved);
        Assert.Equal(["WWW", "WWW", "WWW"], cube.Faces.Up);
    }

    [Fact]
    public async Task CreateCube_WithInvalidSize_ReturnsBadRequestProblem()
    {
        var response = await _client.PostAsJsonAsync("/api/cubes", new { size = 99 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task TaskScenario_OverHttp_ProducesTheExpectedFaces()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/moves", new { moves = "F R' U B' L D'" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();

        Assert.NotNull(cube);
        Assert.Equal(["ROG", "BWW", "BBB"], cube.Faces.Up);
        Assert.Equal(["ORR", "OGW", "WWW"], cube.Faces.Front);
        Assert.Equal(["YBO", "RRW", "OYR"], cube.Faces.Right);
        Assert.Equal(["YBW", "OBY", "YYW"], cube.Faces.Back);
        Assert.Equal(["GYY", "OOG", "BGO"], cube.Faces.Left);
        Assert.Equal(["GGB", "RYR", "RGG"], cube.Faces.Down);
        Assert.Equal(["F", "R'", "U", "B'", "L", "D'"], cube.History);
    }

    [Fact]
    public async Task ApplyMoves_WithInvalidNotation_ReturnsBadRequestProblem()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/moves", new { moves = "F X" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ApplyMoves_WithASliceMove_TurnsTheMiddleLayer()
    {
        var created = await CreateCubeAsync();

        // 2L' is the M' slice: the front column rises into the up face.
        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/moves", new { moves = "2L'" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();
        Assert.NotNull(cube);
        Assert.Equal(["WGW", "WGW", "WGW"], cube.Faces.Up);
        Assert.Equal(["GYG", "GYG", "GYG"], cube.Faces.Front);
        Assert.Equal(["2L'"], cube.History);
    }

    [Fact]
    public async Task ApplyMoves_WithALayerBeyondTheCube_ReturnsBadRequestProblem()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/moves", new { moves = "3R" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task UnknownApiRoute_ReturnsNotFoundInsteadOfTheSpaFallback()
    {
        var response = await _client.GetAsync("/api/no-such-resource");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ApplyMoves_WithExcessiveMoveCount_ReturnsBadRequestProblem()
    {
        var created = await CreateCubeAsync();
        var oversized = string.Join(' ', Enumerable.Repeat("F", 201));

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/moves", new { moves = oversized });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ApplyMoves_OnUnknownCube_ReturnsNotFoundProblem()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{Guid.NewGuid()}/moves", new { moves = "F" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Undo_RevertsTheLastMove()
    {
        var created = await CreateCubeAsync();
        await _client.PostAsJsonAsync($"/api/cubes/{created.Id}/moves", new { moves = "F" });

        var response = await _client.PostAsync($"/api/cubes/{created.Id}/undo", content: null);
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(cube);
        Assert.True(cube.IsSolved);
        Assert.Empty(cube.History);
    }

    [Fact]
    public async Task Undo_WithEmptyHistory_ReturnsConflictProblem()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsync($"/api/cubes/{created.Id}/undo", content: null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Reset_RestoresASolvedCube()
    {
        var created = await CreateCubeAsync();
        await _client.PostAsJsonAsync($"/api/cubes/{created.Id}/moves", new { moves = "F R' U2" });

        var response = await _client.PostAsync($"/api/cubes/{created.Id}/reset", content: null);
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(cube);
        Assert.True(cube.IsSolved);
        Assert.Empty(cube.History);
    }

    [Fact]
    public async Task CreateCube_WithoutBody_DefaultsToTheClassicCube()
    {
        var response = await _client.PostAsync("/api/cubes", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();
        Assert.NotNull(cube);
        Assert.Equal(3, cube.Size);
    }

    [Fact]
    public async Task Scramble_WithExcessiveLength_ReturnsBadRequestProblem()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/scramble", new { length = 9999 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Scramble_AppliesRandomMoves()
    {
        var created = await CreateCubeAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/cubes/{created.Id}/scramble", new { length = 20 });
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(cube);
        Assert.Equal(20, cube.History.Count);
    }

    [Fact]
    public async Task Delete_RemovesTheCube()
    {
        var created = await CreateCubeAsync();

        var deleteResponse = await _client.DeleteAsync($"/api/cubes/{created.Id}");
        var getResponse = await _client.GetAsync($"/api/cubes/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Get_ReturnsTheCurrentState()
    {
        var created = await CreateCubeAsync(size: 2);

        var response = await _client.GetAsync($"/api/cubes/{created.Id}");
        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(cube);
        Assert.Equal(2, cube.Size);
        Assert.Equal(created.Id, cube.Id);
    }

    private async Task<CubeStateDto> CreateCubeAsync(int size = 3)
    {
        var response = await _client.PostAsJsonAsync("/api/cubes", new { size });
        response.EnsureSuccessStatusCode();

        var cube = await response.Content.ReadFromJsonAsync<CubeStateDto>();
        Assert.NotNull(cube);
        return cube;
    }
}
