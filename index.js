import { ref, reactive, computed, effect } from '@vue/reactivity'

import { WebClient as Slack } from '@slack/web-api'
import { isTracking, toggleTracker } from './toggl.js'

import config from './config.js'

import { useDeck } from './elgato.js'

const deck = await useDeck()

const slack = new Slack(config.slackToken)

const slackProfile = ref(null)

const workButton = reactive({
	enabled: true,
	working: await isTracking(),
	icon: computed(() => workButton.working ? 'ax-working' : 'ax-off'),
	async onDown () {
		workButton.working = await toggleTracker()
	}
})
deck.buttons[0] = workButton

const doNotDisturbButton = reactive({
	enabled: computed(() => workButton.working),
	doNotDisturb: false,
	icon: computed(() => {
		return doNotDisturbButton.doNotDisturb ? 'do-not-disturb' : 'open'
	}),
	onDown () {
		this.doNotDisturb = !this.doNotDisturb
		if (this.doNotDisturb) {
			slack.users.profile.set({
				profile: {
					status_text: 'Do not Disturb',
					status_emoji: ':no_entry:',
					status_expiration: 0
				}
			})
		} else {
			slack.users.profile.set({
				profile: {
					status_text: '',
					status_emoji: '',
					status_expiration: 0
				}
			})
		}
	}
})
deck.buttons[1] = doNotDisturbButton

const statusButton = reactive({
	enabled: true,
	emoji: computed(() => slackProfile.value?.status_emoji)
})
deck.buttons[2] = statusButton

// POLLING
async function pollSlack () {
	slackProfile.value = (await slack.users.profile.get()).profile
	if (slackProfile.value.status_emoji === ':no_entry:') {
		doNotDisturbButton.doNotDisturb = true
	}
}

pollSlack()
setInterval(pollSlack, 1000 * 10)

// console.log(await startTracker())
