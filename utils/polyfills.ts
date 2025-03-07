import { Buffer } from "buffer";
import "react-native-get-random-values"; // crypto.getRandomValues polyfill

global.Buffer = Buffer;
