namespace RubiksCube.Application.Sessions;

/// <summary>
/// Port for storing cube sessions. Implementations must be safe for concurrent use.
/// </summary>
/// <remarks>
/// The port is synchronous by design: the only adapter is an in-memory store, and a
/// Task-returning surface would be speculative. If a persistent adapter ever appears,
/// widening this interface is a mechanical change confined to the use cases.
/// </remarks>
public interface ICubeSessionRepository
{
    /// <summary>Returns the session with the given <paramref name="id"/>.</summary>
    /// <param name="id">The session identifier.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    CubeSession Get(Guid id);

    /// <summary>Adds a new session to the store.</summary>
    /// <param name="session">The session to add.</param>
    void Add(CubeSession session);

    /// <summary>
    /// Atomically replaces the session with the given <paramref name="id"/> by applying
    /// <paramref name="update"/> to its current value, and returns the updated session.
    /// Concurrent updates to the same session never interleave.
    /// </summary>
    /// <param name="id">The session identifier.</param>
    /// <param name="update">A pure function producing the new session state.</param>
    /// <exception cref="CubeSessionNotFoundException">Thrown when no such session exists.</exception>
    CubeSession Update(Guid id, Func<CubeSession, CubeSession> update);

    /// <summary>
    /// Removes the session with the given <paramref name="id"/>;
    /// returns <see langword="false"/> when it did not exist.
    /// </summary>
    /// <param name="id">The session identifier.</param>
    bool Delete(Guid id);
}
