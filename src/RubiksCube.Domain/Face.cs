namespace RubiksCube.Domain;

/// <summary>
/// The six faces of the cube, named after the standard Singmaster notation
/// (U, D, F, B, L, R).
/// </summary>
public enum Face
{
    /// <summary>The top face (U).</summary>
    Up,

    /// <summary>The bottom face (D).</summary>
    Down,

    /// <summary>The face towards the viewer (F).</summary>
    Front,

    /// <summary>The face away from the viewer (B).</summary>
    Back,

    /// <summary>The face on the viewer's left (L).</summary>
    Left,

    /// <summary>The face on the viewer's right (R).</summary>
    Right,
}
