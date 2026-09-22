// The platform CSPRNG, before anything that could ask for randomness.
//
// `@sentinel/crypto` generates every device key through `@noble/*`, which
// reaches for `crypto.getRandomValues`. Hermes does not have it, so without
// this line the app throws on its first render — which is what it did, and is
// the right failure: a security product that quietly fell back to `Math.random`
// for an X25519 secret would be worse than one that will not start. ADR-0014.
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';

import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
