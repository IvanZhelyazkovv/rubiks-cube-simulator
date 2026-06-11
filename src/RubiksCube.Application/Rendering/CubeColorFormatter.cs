using RubiksCube.Domain;

namespace RubiksCube.Application.Rendering;

/// <summary>
/// Maps cube colours to the single letters used in textual cube representations.
/// </summary>
public static class CubeColorFormatter
{
    /// <summary>
    /// Returns the conventional single-letter code of a colour:
    /// W, Y, G, B, R or O.
    /// </summary>
    /// <param name="color">The colour to format.</param>
    public static char ToLetter(CubeColor color) => color switch
    {
        CubeColor.White => 'W',
        CubeColor.Yellow => 'Y',
        CubeColor.Green => 'G',
        CubeColor.Blue => 'B',
        CubeColor.Red => 'R',
        CubeColor.Orange => 'O',
        _ => throw new ArgumentOutOfRangeException(nameof(color), color, "Unknown colour."),
    };
}
