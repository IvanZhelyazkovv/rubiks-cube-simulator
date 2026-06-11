namespace RubiksCube.Tests.Cli;

/// <summary>
/// The console is process-global state, so tests in this collection must not run
/// alongside anything else that might write to it.
/// </summary>
[CollectionDefinition(nameof(ConsoleSequentialCollection), DisableParallelization = true)]
public sealed class ConsoleSequentialCollection
{
}
