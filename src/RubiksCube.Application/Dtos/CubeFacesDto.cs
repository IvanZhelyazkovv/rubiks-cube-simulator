namespace RubiksCube.Application.Dtos;

/// <summary>
/// The six faces of the cube, each as rows of colour letters from top to bottom
/// (e.g. <c>"WWW"</c>) using W, Y, G, B, R, O. Named properties — rather than a
/// dictionary — so the published OpenAPI contract guarantees all six faces and
/// generated clients get them statically typed.
/// </summary>
/// <param name="Up">The up face.</param>
/// <param name="Down">The down face.</param>
/// <param name="Front">The front face.</param>
/// <param name="Back">The back face.</param>
/// <param name="Left">The left face.</param>
/// <param name="Right">The right face.</param>
public sealed record CubeFacesDto(
    IReadOnlyList<string> Up,
    IReadOnlyList<string> Down,
    IReadOnlyList<string> Front,
    IReadOnlyList<string> Back,
    IReadOnlyList<string> Left,
    IReadOnlyList<string> Right);
