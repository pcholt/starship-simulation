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
