#!/bin/bash
aecArgs="$*"
# If no "aec_args" are passed on to the script, use this "aec_args" as default:
[ -z "$aecArgs" ] && aecArgs="analog_gain_control=0 digital_gain_control=1"
fromSource="alsa_input.usb-Roland_UA-25EX-00.analog-stereo"
fromSink="alsa_output.pci-0000_67_00.1.HiFi__hw_Generic_3__sink"
newSourceName="echoCancelSource"
newSinkName="echoCancelSink"

echo Load module \"module-switch-on-connect\" with \"ignore_virtual=no\"
pactl unload-module module-switch-on-connect 2>/dev/null
pactl load-module module-switch-on-connect ignore_virtual=no

echo Reload \"module-echo-cancel\" with \"aec_args=$aecArgs\"
pactl unload-module module-echo-cancel 2>/dev/null
if pactl load-module module-echo-cancel source_master=$fromSource use_master_format=1 aec_method=webrtc aec_args=\"$aecArgs\" source_name=$newSourceName sink_name=$newSinkName; then
	pactl set-default-source $newSourceName
	pactl set-default-sink $newSinkName
fi
