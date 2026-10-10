<script lang="ts">
	import { ALL_SPECIALITIES, CREW_ROSTER, SPECIALITY_LABELS, type CrewStatus, type Speciality } from '@starship/engine';
	import '../../dense-table.css';
	import Panel from '../shared/Panel.svelte';
	import {
		buildCrewRows,
		filterCrewRows,
		sortCrewRows,
		summarizeCrew,
		type CrewSortKey,
		type SortDirection
	} from './crew-roster-view.js';

	interface Props {
		crewStatus: CrewStatus[];
	}

	let { crewStatus }: Props = $props();

	const MAX_HEALTH = 10;
	const COLUMNS: { key: CrewSortKey; label: string }[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'rank', label: 'Rank' },
		{ key: 'speciality', label: 'Speciality' },
		{ key: 'location', label: 'Location' },
		{ key: 'health', label: 'Health' }
	];

	let specialityFilter: Speciality | 'all' = $state('all');
	let search = $state('');
	let sortKey: CrewSortKey = $state('rank');
	let sortDirection: SortDirection = $state('ascending');

	let allRows = $derived(buildCrewRows(CREW_ROSTER, crewStatus));
	let visibleRows = $derived(sortCrewRows(filterCrewRows(allRows, { speciality: specialityFilter, search }), sortKey, sortDirection));
	let summary = $derived(summarizeCrew(allRows));

	function healthStatus(health: number): 'ok' | 'warning' | 'critical' {
		if (health >= 7) return 'ok';
		if (health >= 3) return 'warning';
		return 'critical';
	}

	function sortBy(key: CrewSortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
			return;
		}
		sortKey = key;
		sortDirection = 'ascending';
	}

	function ariaSort(key: CrewSortKey): 'ascending' | 'descending' | 'none' {
		return sortKey === key ? sortDirection : 'none';
	}
</script>

<Panel title="Crew Roster" accentVar="chrome-medical" grow>
	<div class="roster-controls">
		<label>
			Speciality
			<select bind:value={specialityFilter} aria-label="Filter by speciality">
				<option value="all">All</option>
				{#each ALL_SPECIALITIES as speciality (speciality)}
					<option value={speciality}>{SPECIALITY_LABELS[speciality]}</option>
				{/each}
			</select>
		</label>
		<label>
			Name
			<input type="text" bind:value={search} aria-label="Search crew by name" placeholder="Search" />
		</label>
		<span class="summary" data-testid="crew-summary">
			{summary.total} crew · {summary.injured} injured · {summary.dead} dead
		</span>
	</div>

	<div class="roster-scroller">
		<table class="dense-table" data-testid="crew-roster">
			<thead>
				<tr>
					{#each COLUMNS as column (column.key)}
						<th aria-sort={ariaSort(column.key)} data-testid={`sort-${column.key}`}>
							<button type="button" class="sort-button" onclick={() => sortBy(column.key)}>{column.label}</button>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each visibleRows as row (row.id)}
					<tr data-testid={`crew-row-${row.id}`}>
						<td>{row.name}</td>
						<td>{row.rankLabel}</td>
						<td>{row.specialityLabel}</td>
						<td>{row.locationLabel}</td>
						<td class="health-cell">
							<span class="health-bar" data-status={healthStatus(row.health)}>
								<span class="health-bar__fill" style:width="{(row.health / MAX_HEALTH) * 100}%"></span>
							</span>
							<span data-testid={`crew-health-${row.id}`}>{row.health.toFixed(1)}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Panel>

<style>
	.roster-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.roster-controls label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.roster-controls select,
	.roster-controls input {
		font-size: 0.7rem;
		padding: 1px var(--space-2);
	}

	.summary {
		margin-left: auto;
		font-family: var(--font-data);
	}

	.roster-scroller {
		flex: 1 1 0;
		min-height: 10rem;
		overflow-y: auto;
	}

	.sort-button {
		all: unset;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	th[aria-sort='ascending'] .sort-button::after {
		content: ' ▲';
	}

	th[aria-sort='descending'] .sort-button::after {
		content: ' ▼';
	}

	.health-cell {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.health-bar {
		display: inline-block;
		width: 2.5rem;
		height: 0.35rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.health-bar__fill {
		display: block;
		height: 100%;
	}

	.health-bar[data-status='ok'] .health-bar__fill {
		background: var(--status-ok);
	}

	.health-bar[data-status='warning'] .health-bar__fill {
		background: var(--status-warning);
	}

	.health-bar[data-status='critical'] .health-bar__fill {
		background: var(--status-critical);
	}
</style>
