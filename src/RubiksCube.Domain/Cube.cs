using System.Collections.Immutable;

using RubiksCube.Domain.Geometry;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Domain;

/// <summary>
/// An immutable N×N×N Rubik's cube. Applying a move never mutates the cube;
/// it returns a new <see cref="Cube"/> with the rotation applied.
/// </summary>
/// <remarks>
/// <para>
/// Rotations are computed geometrically rather than through hand-written sticker
/// permutation tables. Every sticker is identified by an exact integer position in
/// cube space together with the outward normal of the face it sits on
/// (see <see cref="FaceOrientation"/>). Turning a layer rotates the positions and
/// normals of every sticker in that layer by 90° around the face axis, and the
/// results are mapped back to grid coordinates. Inner-slice turns (<c>2L</c>, the
/// M slice) are the same rotation applied to a different plane along the axis.
/// </para>
/// <para>
/// This makes correctness reviewable in one place: if the six face orientations match
/// the standard cube net, every rotation of every face — for any cube size — follows
/// from the same 90° integer rotation, and no per-face special cases exist.
/// </para>
/// <para>
/// Sticker positions use doubled coordinates so that everything stays an integer:
/// a cube of size N spans [-N, N], sticker centres sit at odd or even offsets
/// 2i − (N − 1) for grid index i, and the stickers of a face lie on the plane ±N.
/// A face's outer layer is then exactly the set of stickers whose position component
/// along the face normal is N (the face itself) or N − 1 (the adjacent ring).
/// </para>
/// </remarks>
public sealed class Cube : IEquatable<Cube>
{
    /// <summary>The smallest supported cube size.</summary>
    public const int MinSize = 2;

    private static readonly Face[] Faces = Enum.GetValues<Face>();

    private readonly ImmutableArray<CubeColor> _stickers;

    private Cube(int size, ImmutableArray<CubeColor> stickers)
    {
        Size = size;
        _stickers = stickers;
    }

    /// <summary>The number of stickers along one edge of a face (3 for a classic cube).</summary>
    public int Size { get; }

    /// <summary>
    /// <see langword="true"/> when every face shows a single colour.
    /// </summary>
    public bool IsSolved
    {
        get
        {
            foreach (var face in Faces)
            {
                var expected = _stickers[StickerIndex(face, 0, 0)];
                for (var row = 0; row < Size; row++)
                {
                    for (var column = 0; column < Size; column++)
                    {
                        if (_stickers[StickerIndex(face, row, column)] != expected)
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }
    }

    /// <summary>
    /// The colour of the sticker at the given grid position of a face.
    /// Row 0 is the top of the face and column 0 its left, as seen on the
    /// standard exploded view.
    /// </summary>
    /// <param name="face">The face to read.</param>
    /// <param name="row">The zero-based row, counted from the top of the face.</param>
    /// <param name="column">The zero-based column, counted from the left of the face.</param>
    public CubeColor this[Face face, int row, int column]
    {
        get
        {
            ValidateGridIndex(row, nameof(row));
            ValidateGridIndex(column, nameof(column));
            return _stickers[StickerIndex(face, row, column)];
        }
    }

    /// <summary>
    /// Creates a solved cube of the given <paramref name="size"/> using the given
    /// colour <paramref name="scheme"/> (the standard scheme when omitted).
    /// </summary>
    /// <param name="size">The number of stickers along one edge of a face.</param>
    /// <param name="scheme">The colour of each face; <see cref="ColorScheme.Standard"/> when omitted.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="size"/> is smaller than <see cref="MinSize"/>.
    /// </exception>
    public static Cube CreateSolved(int size = 3, ColorScheme? scheme = null)
    {
        if (size < MinSize)
        {
            throw new ArgumentOutOfRangeException(
                nameof(size), size, $"Cube size must be at least {MinSize}.");
        }

        scheme ??= ColorScheme.Standard;

        var stickers = new CubeColor[6 * size * size];
        foreach (var face in Faces)
        {
            var color = scheme.ColorOf(face);
            var offset = (int)face * size * size;
            Array.Fill(stickers, color, offset, size * size);
        }

        return new Cube(size, [.. stickers]);
    }

    /// <summary>Returns a new cube with the given <paramref name="move"/> applied.</summary>
    /// <param name="move">The layer rotation to apply.</param>
    /// <exception cref="InvalidLayerException">
    /// Thrown when the move's layer does not exist on a cube of this size.
    /// </exception>
    public Cube Apply(Move move)
    {
        if (move.Layer < 1 || move.Layer >= Size)
        {
            throw new InvalidLayerException(move.Layer, Size);
        }

        var result = this;
        var clockwise = move.Direction != RotationDirection.CounterClockwise;
        var turns = move.Direction == RotationDirection.HalfTurn ? 2 : 1;

        for (var turn = 0; turn < turns; turn++)
        {
            result = result.ApplyQuarterTurn(move.Face, clockwise, move.Layer);
        }

        return result;
    }

    /// <summary>Returns a new cube with all <paramref name="moves"/> applied in order.</summary>
    /// <param name="moves">The face rotations to apply, in order.</param>
    public Cube Apply(IEnumerable<Move> moves)
    {
        ArgumentNullException.ThrowIfNull(moves);

        var result = this;
        foreach (var move in moves)
        {
            result = result.Apply(move);
        }

        return result;
    }

    /// <summary>
    /// Returns a copy of one face's colours as a grid indexed by [row, column],
    /// row 0 at the top and column 0 on the left of the standard exploded view.
    /// </summary>
    /// <param name="face">The face to read.</param>
    public CubeColor[,] GetFaceColors(Face face)
    {
        var grid = new CubeColor[Size, Size];
        for (var row = 0; row < Size; row++)
        {
            for (var column = 0; column < Size; column++)
            {
                grid[row, column] = _stickers[StickerIndex(face, row, column)];
            }
        }

        return grid;
    }

    /// <inheritdoc />
    public bool Equals(Cube? other) =>
        other is not null && Size == other.Size && _stickers.SequenceEqual(other._stickers);

    /// <inheritdoc />
    public override bool Equals(object? obj) => obj is Cube cube && Equals(cube);

    /// <inheritdoc />
    public override int GetHashCode()
    {
        var hash = default(HashCode);
        hash.Add(Size);
        foreach (var sticker in _stickers)
        {
            hash.Add(sticker);
        }

        return hash.ToHashCode();
    }

    private static Vector3Int Rotate(Vector3Int vector, Vector3Int axis, bool clockwise) =>
        clockwise ? vector.RotateClockwiseAround(axis) : vector.RotateCounterClockwiseAround(axis);

    private Cube ApplyQuarterTurn(Face face, bool clockwise, int layer)
    {
        // "Clockwise" is as seen looking at the face from outside the cube —
        // that is, from the tip of its outward normal.
        var axis = FaceOrientation.Of(face).Normal;
        var rotated = _stickers.ToArray();

        // Layer k sits at N + 1 − 2k along the axis: the outer ring (k = 1) at
        // N − 1, the next slice at N − 3, and so on. The face's own stickers
        // (dot = N) turn only with the outer layer.
        var layerCoordinate = Size + 1 - (2 * layer);

        foreach (var sourceFace in Faces)
        {
            var orientation = FaceOrientation.Of(sourceFace);
            for (var row = 0; row < Size; row++)
            {
                for (var column = 0; column < Size; column++)
                {
                    var position = PositionOf(orientation, row, column);

                    var dot = position.Dot(axis);
                    var inLayer = layer == 1 ? dot >= Size - 1 : dot == layerCoordinate;
                    if (!inLayer)
                    {
                        continue;
                    }

                    var newPosition = Rotate(position, axis, clockwise);
                    var newNormal = Rotate(orientation.Normal, axis, clockwise);

                    var targetFace = FaceOrientation.FromNormal(newNormal);
                    var target = FaceOrientation.Of(targetFace);
                    var targetRow = GridIndexAlong(newPosition, target.RowDirection);
                    var targetColumn = GridIndexAlong(newPosition, target.ColumnDirection);

                    rotated[StickerIndex(targetFace, targetRow, targetColumn)] =
                        _stickers[StickerIndex(sourceFace, row, column)];
                }
            }
        }

        return new Cube(Size, [.. rotated]);
    }

    /// <summary>
    /// Maps a sticker's grid position to its centre in doubled cube coordinates:
    /// the face plane at N along the normal, plus offsets 2i − (N − 1) along the
    /// face's row and column directions. For a 3×3, in-plane offsets are −2, 0
    /// and 2 while face planes sit at ±3 — everything stays an exact integer.
    /// </summary>
    private Vector3Int PositionOf(FaceOrientation orientation, int row, int column) =>
        (Size * orientation.Normal)
        + (((2 * row) - (Size - 1)) * orientation.RowDirection)
        + (((2 * column) - (Size - 1)) * orientation.ColumnDirection);

    /// <summary>Inverse of <see cref="PositionOf"/> along one grid direction.</summary>
    private int GridIndexAlong(Vector3Int position, Vector3Int direction) =>
        (position.Dot(direction) + Size - 1) / 2;

    private int StickerIndex(Face face, int row, int column) =>
        ((int)face * Size * Size) + (row * Size) + column;

    private void ValidateGridIndex(int value, string parameterName)
    {
        if (value < 0 || value >= Size)
        {
            throw new ArgumentOutOfRangeException(
                parameterName, value, $"Index must be between 0 and {Size - 1}.");
        }
    }
}
