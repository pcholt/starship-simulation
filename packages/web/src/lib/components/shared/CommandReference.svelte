<script lang="ts">
	interface CommandDescription {
		description: string;
		syntax: string;
	}

	interface Props {
		commands: CommandDescription[];
	}

	let { commands }: Props = $props();
</script>

<details>
	<summary>Commands</summary>
	<table>
		<thead>
			<tr>
				<th>FUNCTION</th>
				<th>COMMAND FORMAT</th>
			</tr>
		</thead>
		<tbody>
			{#each commands as command (command.syntax)}
				<tr>
					<td>{command.description}</td>
					<td><code>{command.syntax}</code></td>
				</tr>
			{/each}
		</tbody>
	</table>
</details>

<style>
	details {
		margin-top: var(--space-4);
	}

	summary {
		cursor: pointer;
		font-family: var(--font-body);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	summary:hover {
		color: var(--text-primary);
	}

	table {
		margin-top: var(--space-2);
	}

	code {
		background: var(--panel-alt);
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-data);
	}
</style>
