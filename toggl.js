import config from './config.js'

async function toggl (method, url, data) {
	const response = await fetch(`https://api.track.toggl.com/api/v9${url}`, {
		headers: {
			'Authorization': `Basic ${Buffer.from(`${config.toggl.token}:api_token`).toString('base64')}`,
			'Content-Type': 'application/json',
			// 'Accept': 'application/json'
		},
		method,
		body: data ? JSON.stringify(data) : undefined
	})
	return response.json()
}

export async function getRunningTimeEntry () {
	return (await toggl('GET', '/me/time_entries/current'))
}

export async function isTracking () {
	return !!(await getRunningTimeEntry())
}

export async function toggleTracker () {
	const entry = await getRunningTimeEntry()
	if (entry) {
		await toggl('PATCH', `/workspaces/${config.toggl.workspace}/time_entries/${entry.id}/stop`)
		return false
	} else {
		const response = await toggl('POST', `/workspaces/${config.toggl.workspace}/time_entries`, {
			created_with: 'elgato',
			duration: -1,
			start: new Date().toISOString(),
			workspace_id: config.toggl.workspace,
			description: 'wörk'
		})
		return true
	}
}

