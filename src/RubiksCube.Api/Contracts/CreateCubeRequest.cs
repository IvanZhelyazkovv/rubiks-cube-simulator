namespace RubiksCube.Api.Contracts;

/// <summary>
/// Request body for creating a cube session.
/// </summary>
/// <param name="Size">The cube size; the classic 3×3 cube when omitted.</param>
public sealed record CreateCubeRequest(int? Size);
