namespace RubiksCube.Api.Contracts;

/// <summary>
/// Request body for applying moves to a cube.
/// </summary>
/// <param name="Moves">The moves in Singmaster notation, e.g. <c>"F R' U2"</c>.</param>
public sealed record ApplyMovesRequest(string Moves);
