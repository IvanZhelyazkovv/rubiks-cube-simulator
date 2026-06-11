namespace RubiksCube.Application.Dtos;

/// <summary>
/// The client-facing representation of a cube session.
/// </summary>
/// <param name="Id">The session identifier.</param>
/// <param name="Size">The cube size (3 for the classic cube).</param>
/// <param name="IsSolved">Whether every face currently shows a single colour.</param>
/// <param name="Faces">
/// The six faces keyed by name (<c>up</c>, <c>down</c>, <c>front</c>, <c>back</c>,
/// <c>left</c>, <c>right</c>), each as rows of colour letters from top to bottom,
/// e.g. <c>"WWW"</c> — using W, Y, G, B, R, O.
/// </param>
/// <param name="History">Every move applied since creation or the last reset, in Singmaster notation.</param>
public sealed record CubeStateDto(
    Guid Id,
    int Size,
    bool IsSolved,
    IReadOnlyDictionary<string, IReadOnlyList<string>> Faces,
    IReadOnlyList<string> History);
