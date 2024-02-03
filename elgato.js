import { usb } from 'usb'
import { listStreamDecks, openStreamDeck } from '@elgato-stream-deck/node'
import { ref, reactive, computed, effect } from '@vue/reactivity'
import fs from 'fs/promises'
import sharp from 'sharp'
import emojiSource from 'emoji-datasource/emoji.json' with { type: 'json' }

// emoji on linux are a total clusterfuck, fontkit can't render noto, I'm just going to download the svgs
const EMOJI_BORDER = 12
const emojiMap = {}

for (const emoji of emojiSource) {
	if (emoji.short_names) {
		for (const name of emoji.short_names) {
			emojiMap[name] = emoji
		}
	}
}

export async function useDeck () {
	const buttons = []
	const buttonEffects = []

	const deck = ref(null)

	connectStreamDeck()
	usb.on('attach', function (e) {
		if (e.deviceDescriptor.idVendor === 0x0fd9) {
			connectStreamDeck()
		}
	})
	usb.on('detach', function (e) {
		if (e.deviceDescriptor.idVendor === 0x0fd9) {
			deck.value = null
		}
	})

	return {
		buttons: new Proxy(buttons, {
			get(target, prop, receiver) {
				return Reflect.get(...arguments)
			},
			set(target, idx, button, receiver) {
				idx = Number(idx)
				if (buttonEffects[idx]) buttonEffects[idx].effect.stop()
				buttons[idx] = button
				buttonEffects[idx] = registerButton(idx, button)
				return true
			}
		})
	}

	async function connectStreamDeck () {
		console.log('connecting to deck')
		const deckList = await listStreamDecks()
		if (!deckList[0]) {
			console.log('no deck found, waiting')
			return
		}
		deck.value = await openStreamDeck(deckList[0].path)
		await deck.value.clearPanel()
		deck.value.setBrightness(50)

		deck.value.on('down', (keyIndex) => {
			if (!buttons[keyIndex]) return
			buttons[keyIndex]?.onDown?.()
		})
	
		deck.value.on('up', (keyIndex) => {
			if (!buttons[keyIndex]) return
			buttons[keyIndex]?.onUp?.()
		})
	}

	function registerButton (idx, button) {
		return effect(async () => {
			if (!deck.value) return
			const ICON_SIZE = deck.value.ICON_SIZE
			if (!button.enabled) {
				deck.value.clearKey(idx)
				return
			}
			if (button.emoji) {
				try {
					const emoji = emojiMap[button.emoji.replaceAll(':', '')]
					if (!emoji) return
					let path
					try {
						path = `noto-emoji/svg/emoji_u${emoji.unified.replaceAll('-', '_').toLowerCase()}.svg`
						await fs.access(path)
					} catch (e) {
						path = `noto-emoji/svg/emoji_u${emoji.non_qualified.replaceAll('-', '_').toLowerCase()}.svg`
					}
					const buffer = await sharp(path).flatten().resize(ICON_SIZE - EMOJI_BORDER * 2, ICON_SIZE - EMOJI_BORDER * 2).extend(EMOJI_BORDER).raw().toBuffer()
					deck.value.fillKeyBuffer(idx, buffer)
				} catch (error) {
					console.log(error)
					deck.value.fillKeyColor(idx, 255, 0, 0)
				}
			} else if (button.icon) {
				const buffer = await sharp(`icons/${button.icon}.svg`).flatten().resize(ICON_SIZE, ICON_SIZE).raw().toBuffer()
				deck.value.fillKeyBuffer(idx, buffer)
			} else if (button.color) {
				deck.value.fillKeyColor(idx, ...button.color)
			} else {
				deck.value.clearKey(idx)
			}
		})
	}
}







