namespace RubiksCube.Api.Contracts;

/// <summary>
/// Request body for scrambling a cube.
/// </summary>
/// <param name="Length">The number of random moves; a sensible default when omitted.</param>
public sealed record ScrambleRequest(int? Length);
