namespace RubiksCube.Application.Dtos;

/// <summary>
/// The client-facing representation of a cube session.
/// </summary>
/// <param name="Id">The session identifier.</param>
/// <param name="Size">The cube size (3 for the classic cube).</param>
/// <param name="IsSolved">Whether every face currently shows a single colour.</param>
/// <param name="Faces">The six faces, statically named in the contract.</param>
/// <param name="History">Every move applied since creation or the last reset, in Singmaster notation.</param>
public sealed record CubeStateDto(
    Guid Id,
    int Size,
    bool IsSolved,
    CubeFacesDto Faces,
    IReadOnlyList<string> History);
