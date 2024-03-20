# personal stream deck buttons for work automation

- toggl time tracking
- slack do not disturb toggle
- shows current slack status emoji

# setup

```sh
cp config.dist.js config.js # fill out the necessary fields
npm ci
git submodule update --init --recursive
systemctl --user enable ./elgato.service
```

You probably need to change some paths in the service file and elsewhere.
