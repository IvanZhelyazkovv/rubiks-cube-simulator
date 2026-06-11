namespace RubiksCube.Domain.Geometry;

/// <summary>
/// Defines how each face's two-dimensional sticker grid is oriented in cube space.
/// </summary>
/// <remarks>
/// <para>
/// This table is the single place where the spatial convention of the cube lives.
/// Everything else — face rotation, the layer a move turns, the exploded view —
/// is derived from it, so its correctness can be reviewed in one screen.
/// </para>
/// <para>
/// The coordinate system is right-handed: +X points towards the <see cref="Face.Right"/>
/// face, +Y towards <see cref="Face.Up"/> and +Z towards <see cref="Face.Front"/> (the viewer).
/// Each face is described by its outward <see cref="Normal"/> together with the directions in
/// which its grid rows and columns grow. The orientations follow the standard exploded-view
/// (net) layout — Up above Front; Left, Front, Right, Back side by side; Down below Front —
/// which matches both Singmaster notation and popular tools such as rubiks-cube-solver.com.
/// </para>
/// </remarks>
internal sealed class FaceOrientation
{
    private static readonly FaceOrientation UpOrientation =
        new(Vector3Int.UnitY, rowDirection: Vector3Int.UnitZ, columnDirection: Vector3Int.UnitX);

    private static readonly FaceOrientation DownOrientation =
        new(-Vector3Int.UnitY, rowDirection: -Vector3Int.UnitZ, columnDirection: Vector3Int.UnitX);

    private static readonly FaceOrientation FrontOrientation =
        new(Vector3Int.UnitZ, rowDirection: -Vector3Int.UnitY, columnDirection: Vector3Int.UnitX);

    private static readonly FaceOrientation BackOrientation =
        new(-Vector3Int.UnitZ, rowDirection: -Vector3Int.UnitY, columnDirection: -Vector3Int.UnitX);

    private static readonly FaceOrientation LeftOrientation =
        new(-Vector3Int.UnitX, rowDirection: -Vector3Int.UnitY, columnDirection: Vector3Int.UnitZ);

    private static readonly FaceOrientation RightOrientation =
        new(Vector3Int.UnitX, rowDirection: -Vector3Int.UnitY, columnDirection: -Vector3Int.UnitZ);

    private FaceOrientation(Vector3Int normal, Vector3Int rowDirection, Vector3Int columnDirection)
    {
        Normal = normal;
        RowDirection = rowDirection;
        ColumnDirection = columnDirection;
    }

    /// <summary>All six faces in a fixed order, convenient for iteration.</summary>
    public static IReadOnlyList<Face> AllFaces { get; } =
        [Face.Up, Face.Down, Face.Front, Face.Back, Face.Left, Face.Right];

    /// <summary>The face's outward unit normal.</summary>
    public Vector3Int Normal { get; }

    /// <summary>The direction in which row indices grow (top of the grid to bottom).</summary>
    public Vector3Int RowDirection { get; }

    /// <summary>The direction in which column indices grow (left of the grid to right).</summary>
    public Vector3Int ColumnDirection { get; }

    /// <summary>Returns the orientation of the given <paramref name="face"/>.</summary>
    public static FaceOrientation Of(Face face) => face switch
    {
        Face.Up => UpOrientation,
        Face.Down => DownOrientation,
        Face.Front => FrontOrientation,
        Face.Back => BackOrientation,
        Face.Left => LeftOrientation,
        Face.Right => RightOrientation,
        _ => throw new ArgumentOutOfRangeException(nameof(face), face, "Unknown face."),
    };

    /// <summary>Returns the face whose outward normal equals <paramref name="normal"/>.</summary>
    public static Face FromNormal(Vector3Int normal)
    {
        foreach (var face in AllFaces)
        {
            if (Of(face).Normal == normal)
            {
                return face;
            }
        }

        throw new ArgumentException($"No face has normal {normal}.", nameof(normal));
    }
}
