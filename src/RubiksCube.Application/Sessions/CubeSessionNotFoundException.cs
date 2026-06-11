namespace RubiksCube.Application.Sessions;

/// <summary>
/// Thrown when a cube session id does not correspond to any stored session.
/// </summary>
public sealed class CubeSessionNotFoundException : Exception
{
    /// <summary>Creates the exception for the given session <paramref name="id"/>.</summary>
    /// <param name="id">The identifier that was not found.</param>
    public CubeSessionNotFoundException(Guid id)
        : base($"No cube session with id '{id}' exists.")
    {
        Id = id;
    }

    /// <summary>The identifier that was not found.</summary>
    public Guid Id { get; }
}
