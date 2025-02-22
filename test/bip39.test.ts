import {
  entropyToMnemonic,
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
} from '..';
import { wordlist as englishWordlist } from '../wordlists/english';
import { wordlist as japaneseWordlist } from '../wordlists/japanese';
import { wordlist as spanishWordlist } from '../wordlists/spanish';
import { bytesToHex as toHex } from '@noble/hashes/utils';
import { deepStrictEqual, throws } from './assert';

export function equalsBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new TypeError(`hexToBytes: expected string, got ${typeof hex}`);
  }
  if (hex.length % 2) {
    throw new Error('hexToBytes: received invalid unpadded hex');
  }
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
  }
  return array;
}

describe('BIP39', () => {
  describe('Mnemonic generation', () => {
    it('should create a valid menomic', async () => {
      const mnemonic = generateMnemonic(englishWordlist, 128);
      await deepStrictEqual(validateMnemonic(mnemonic, englishWordlist), true);
    });
  });

  describe('Mnemonic validation', () => {
    it('should accept valid menomics', async () => {
      await deepStrictEqual(
        validateMnemonic(
          'jump police vessel depth mutual idea cable soap trophy dust hold wink',
          englishWordlist
        ),
        true
      );

      await deepStrictEqual(
        validateMnemonic(
          'koala óxido urbe crudo momia idioma boina rostro títere dilema himno víspera',
          spanishWordlist
        ),
        true
      );

      const indices = [
        'jump',
        'police',
        'vessel',
        'depth',
        'mutual',
        'idea',
        'cable',
        'soap',
        'trophy',
        'dust',
        'hold',
        'wink',
      ].map((word) => englishWordlist.indexOf(word));
      const uInt8ArrayOfMnemonic = new Uint8Array(new Uint16Array(indices).buffer);
      await deepStrictEqual(validateMnemonic(uInt8ArrayOfMnemonic, englishWordlist), true);
    });

    it('should reject invalid menomics', async () => {
      await deepStrictEqual(validateMnemonic('asd', englishWordlist), false);

      const indices = [
        'test',
        'test',
        'vessel',
        'depth',
        'mutual',
        'idea',
        'cable',
        'soap',
        'trophy',
        'dust',
        'hold',
        'wink',
      ].map((word) => englishWordlist.indexOf(word));
      const uInt8ArrayOfMnemonic = new Uint8Array(new Uint16Array(indices).buffer);
      await deepStrictEqual(validateMnemonic(uInt8ArrayOfMnemonic, englishWordlist), false);
    });
  });

  describe('Entropy-mnemonic convertions', () => {
    describe('Should convert from mnemonic to entropy and back', () => {
      it('should work with the English wodlist', async () => {
        const mnemonic = generateMnemonic(englishWordlist, 128);
        const entropy = mnemonicToEntropy(mnemonic, englishWordlist);
        await deepStrictEqual(entropyToMnemonic(entropy, englishWordlist), mnemonic);
      });

      it('should work with the Spanish wodlist', async () => {
        const mnemonic = generateMnemonic(spanishWordlist, 128);
        const entropy = mnemonicToEntropy(mnemonic, spanishWordlist);
        await deepStrictEqual(entropyToMnemonic(entropy, spanishWordlist), mnemonic);
      });
    });
  });

  describe('Mnemonic to seed', () => {
    describe('Without passphrase', () => {
      const mnemonic =
        'pill frown erosion humor invest inquiry rich garment seek such mention punch';
      const seed = new Uint8Array([
        213, 198, 189, 89, 252, 121, 48, 207, 56, 105, 8, 152, 129, 116, 186, 218, 26, 71, 225, 55,
        201, 122, 153, 178, 5, 235, 40, 132, 179, 248, 166, 147, 18, 128, 248, 25, 184, 206, 113,
        170, 71, 235, 73, 144, 0, 134, 22, 244, 18, 229, 222, 139, 246, 28, 123, 131, 16, 215, 191,
        216, 252, 159, 213, 235,
      ]);

      describe('Sync', () => {
        it('Should recover the right seed', async () => {
          const recoveredSeed = mnemonicToSeedSync(mnemonic, englishWordlist);
          await deepStrictEqual(equalsBytes(seed, recoveredSeed), true);

          // with Uint8Array formatted mnemonic
          const indices = mnemonic.split(' ').map((word) => englishWordlist.indexOf(word));
          const uInt8ArrayOfMnemonic = new Uint8Array(new Uint16Array(indices).buffer);

          const recoveredSeedWithUint8ArrayMnemonic = mnemonicToSeedSync(
            uInt8ArrayOfMnemonic,
            englishWordlist
          );
          await deepStrictEqual(equalsBytes(seed, recoveredSeedWithUint8ArrayMnemonic), true);
        });
      });

      describe('Async', () => {
        it('Should recover the right seed', async () => {
          const recoveredSeed = await mnemonicToSeed(mnemonic);
          await deepStrictEqual(equalsBytes(seed, recoveredSeed), true);
        });
      });
    });

    describe('With passphrase', () => {
      const mnemonic =
        'pill frown erosion humor invest inquiry rich garment seek such mention punch';
      const seed = new Uint8Array([
        180, 211, 212, 196, 151, 216, 92, 25, 11, 35, 14, 186, 80, 80, 141, 156, 245, 11, 25, 118,
        50, 75, 80, 36, 116, 113, 11, 112, 36, 86, 70, 188, 92, 156, 172, 167, 83, 159, 47, 149, 92,
        107, 130, 66, 39, 251, 34, 169, 115, 143, 121, 110, 166, 28, 221, 93, 252, 165, 155, 127,
        19, 138, 107, 135,
      ]);

      const PASSPHRASE = 'passphrase';

      describe('Sync', () => {
        it('Should recover the right seed with mnemonic passed as string', async () => {
          const recoveredSeed = mnemonicToSeedSync(mnemonic, englishWordlist, PASSPHRASE);
          await deepStrictEqual(seed, recoveredSeed);
        });

        it('Should recover the right seed with mnemonic passed as Uint8Array', async () => {
          // with Uint8Array formatted mnemonic
          const indices = mnemonic.split(' ').map((word) => englishWordlist.indexOf(word));
          const uInt8ArrayOfMnemonic = new Uint8Array(new Uint16Array(indices).buffer);

          const recoveredSeedWithUint8ArrayMnemonic = mnemonicToSeedSync(
            uInt8ArrayOfMnemonic,
            englishWordlist,
            PASSPHRASE
          );

          await deepStrictEqual(seed, recoveredSeedWithUint8ArrayMnemonic);
        });
      });

      describe('Async', () => {
        it('Should recover the right seed', async () => {
          const recoveredSeed = await mnemonicToSeed(mnemonic, PASSPHRASE);
          await deepStrictEqual(seed, recoveredSeed);
        });
      });
    });
  });
  // Based on https://github.com/bitcoinjs/bip39/blob/cfea218ee2e6c3157baabb1e2ec684d36cce89c5/test/index.js
  const VECTORS: Record<string, Array<[string, string, string, Uint8Array?]>> = {
    english: [
      [
        '00000000000000000000000000000000',
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0]),
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'legal winner thank year wave sausage worth useful legal winner thank yellow',
        '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607',
        new Uint8Array([
          251, 3, 223, 7, 254, 6, 247, 7, 191, 7, 253, 5, 239, 7, 127, 7, 251, 3, 223, 7, 254, 6,
          248, 7,
        ]),
      ],
      [
        '80808080808080808080808080808080',
        'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
        'd71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8',
        new Uint8Array([
          4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2, 16, 0, 128, 0, 4, 4, 32, 0, 1, 1, 4, 0,
        ]),
      ],
      [
        'ffffffffffffffffffffffffffffffff',
        'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
        'ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069',
        new Uint8Array([
          255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7,
          245, 7,
        ]),
      ],
      [
        '000000000000000000000000000000000000000000000000',
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent',
        '035895f2f481b1b0f01fcf8c289c794660b289981a78f8106447707fdd9666ca06da5a9a565181599b79f53b844d8a71dd9f439c52a3d7b3e8a79c906ac845fa',
        new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 39, 0,
        ]),
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal will',
        'f2b94508732bcbacbcc020faefecfc89feafa6649a5491b8c952cede496c214a0c7b3c392d168748f2d4a612bada0753b52a1c7ac53c1e93abd5c6320b9e95dd',
        new Uint8Array([
          251, 3, 223, 7, 254, 6, 247, 7, 191, 7, 253, 5, 239, 7, 127, 7, 251, 3, 223, 7, 254, 6,
          247, 7, 191, 7, 253, 5, 239, 7, 127, 7, 251, 3, 217, 7,
        ]),
      ],
      [
        '808080808080808080808080808080808080808080808080',
        'letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter always',
        '107d7c02a5aa6f38c58083ff74f04c607c2d2c0ecc55501dadd72d025b751bc27fe913ffb796f841c49b1d33b610cf0e91d3aa239027f5e99fe4ce9e5088cd65',
        new Uint8Array([
          4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2, 16, 0, 128, 0, 4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2,
          16, 0, 128, 0, 4, 4, 60, 0,
        ]),
      ],
      [
        'ffffffffffffffffffffffffffffffffffffffffffffffff',
        'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo when',
        '0cd6e5d827bb62eb8fc1e262254223817fd068a74b5b449cc2f667c3f1f985a76379b43348d952e2265b4cd129090758b3e3c2c49103b5051aac2eaeb890a528',
        new Uint8Array([
          255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7,
          255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 209, 7,
        ]),
      ],
      [
        '0000000000000000000000000000000000000000000000000000000000000000',
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        'bda85446c68413707090a52022edd26a1c9462295029f2e60cd7c4f2bbd3097170af7a4d73245cafa9c3cca8d561a7c3de6f5d4a10be8ed2a5e608d68f92fcc8',
        new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 102, 0,
        ]),
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth useful legal winner thank year wave sausage worth title',
        'bc09fca1804f7e69da93c2f2028eb238c227f2e9dda30cd63699232578480a4021b146ad717fbb7e451ce9eb835f43620bf5c514db0f8add49f5d121449d3e87',
        new Uint8Array([
          251, 3, 223, 7, 254, 6, 247, 7, 191, 7, 253, 5, 239, 7, 127, 7, 251, 3, 223, 7, 254, 6,
          247, 7, 191, 7, 253, 5, 239, 7, 127, 7, 251, 3, 223, 7, 254, 6, 247, 7, 191, 7, 253, 5,
          239, 7, 23, 7,
        ]),
      ],
      [
        '8080808080808080808080808080808080808080808080808080808080808080',
        'letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic bless',
        'c0c519bd0e91a2ed54357d9d1ebef6f5af218a153624cf4f2da911a0ed8f7a09e2ef61af0aca007096df430022f7a2b6fb91661a9589097069720d015e4e982f',
        new Uint8Array([
          4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2, 16, 0, 128, 0, 4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2,
          16, 0, 128, 0, 4, 4, 32, 0, 1, 1, 8, 0, 64, 0, 2, 2, 16, 0, 189, 0,
        ]),
      ],
      [
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote',
        'dd48c104698c30cfe2b6142103248622fb7bb0ff692eebb00089b32d22484e1613912f0a5b694407be899ffd31ed3992c456cdf60f5d4564b8ba3f05a69890ad',
        new Uint8Array([
          255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7,
          255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7, 255, 7,
          255, 7, 175, 7,
        ]),
      ],
      [
        '77c2b00716cec7213839159e404db50d',
        'jelly better achieve collect unaware mountain thought cargo oxygen act hood bridge',
        'b5b6d0127db1a9d2226af0c3346031d77af31e918dba64287a1b44b8ebf63cdd52676f672a290aae502472cf2d602c051f3e6f18055e84e4c43897fc4e51a6ff',
        new Uint8Array([
          190, 3, 172, 0, 14, 0, 108, 1, 99, 7, 132, 4, 7, 7, 21, 1, 242, 4, 19, 0, 106, 3, 222, 0,
        ]),
      ],
      [
        'b63a9c59a6e641f288ebc103017f1da9f8290b3da6bdef7b',
        'renew stay biology evidence goat welcome casual join adapt armor shuffle fault little machine walk stumble urge swap',
        '9248d83e06f4cd98debf5b6f010542760df925ce46cf38a1bdb4e4de7d21f5c39366941c69e1bdbf2966e0f6e6dbece898a0e2f0a4c2b3e640953dfe8b7bbdc5',
        new Uint8Array([
          177, 5, 167, 6, 179, 0, 110, 2, 32, 3, 202, 7, 29, 1, 193, 3, 24, 0, 95, 0, 59, 6, 159, 2,
          20, 4, 44, 4, 180, 7, 189, 6, 123, 7, 218, 6,
        ]),
      ],
      [
        '3e141609b97933b66a060dcddc71fad1d91677db872031e85f4c015c5e7e8982',
        'dignity pass list indicate nasty swamp pool script soccer toe leaf photo multiply desk host tomato cradle drill spread actor shine dismiss champion exotic',
        'ff7f3184df8696d8bef94b6c03114dbee0ef89ff938712301d27ed8336ca89ef9635da20af07d4175f2bf5f3de130f39c9d9e8dd0472489c19b1a020a940da67',
        new Uint8Array([
          240, 1, 5, 5, 19, 4, 151, 3, 153, 4, 217, 6, 64, 5, 13, 6, 110, 6, 28, 7, 245, 3, 29, 5,
          139, 4, 223, 1, 112, 3, 32, 7, 143, 1, 23, 2, 152, 6, 21, 0, 47, 6, 250, 1, 48, 1, 128, 2,
        ]),
      ],
      [
        '0460ef47585604c5660618db2e6a7e7f',
        'afford alter spike radar gate glance object seek swamp infant panel yellow',
        '65f93a9f36b6c85cbe634ffc1f99f2b82cbb10b31edc7f087b4f6cb9e976e9faf76ff41f8f27c99afdf38f7a303ba1136ee48a4c1e7fcd3dba7aa876113a36e4',
        new Uint8Array([
          35, 0, 59, 0, 142, 6, 133, 5, 2, 3, 21, 3, 192, 4, 24, 6, 217, 6, 154, 3, 252, 4, 248, 7,
        ]),
      ],
      [
        '72f60ebac5dd8add8d2a25a797102c3ce21bc029c200076f',
        'indicate race push merry suffer human cruise dwarf pole review arch keep canvas theme poem divorce alter left',
        '3bbf9daa0dfad8229786ace5ddb4e00fa98a044ae4c4975ffd5e094dba9e0bb289349dbe2091761f30f382d4e35c4a670ee8ab50758d2c55881be69e327117ba',
        new Uint8Array([
          151, 3, 131, 5, 117, 5, 93, 4, 197, 6, 118, 3, 165, 1, 37, 2, 60, 5, 196, 5, 88, 0, 206,
          3, 13, 1, 0, 7, 56, 5, 0, 2, 59, 0, 249, 3,
        ]),
      ],
      [
        '2c85efc7f24ee4573d2b81a6ec66cee209b2dcbd09d8eddc51e0215b0b68e416',
        'clutch control vehicle tonight unusual clog visa ice plunge glimpse recipe series open hour vintage deposit universe tip job dress radar refuse motion taste',
        'fe908f96f46668b2d5b37d82f558c77ed0d69dd0e7e043a5b0511c48c2f1064694a956f86360c93dd04052a8899497ce9e985ebe0c8c52b955e6ae86d4ff4449',
        new Uint8Array([
          100, 1, 123, 1, 143, 7, 36, 7, 114, 7, 92, 1, 165, 7, 129, 3, 55, 5, 25, 3, 157, 5, 32, 6,
          217, 4, 114, 3, 161, 7, 216, 1, 110, 7, 20, 7, 192, 3, 21, 2, 133, 5, 163, 5, 130, 4, 241,
          6,
        ]),
      ],
      [
        'eaebabb2383351fd31d703840b32e9e2',
        'turtle front uncle idea crush write shrug there lottery flower risk shell',
        'bdfb76a0759f301b0b899a1e3985227e53b3f51e67e3f2a65363caedf3e32fde42a66c404f18d7b05818c95ef3ca1e5146646856c461c073169467511680876c',
        new Uint8Array([
          87, 7, 234, 2, 100, 7, 131, 3, 168, 1, 244, 7, 58, 6, 3, 7, 32, 4, 204, 2, 211, 5, 43, 6,
        ]),
      ],
      [
        '7ac45cfe7722ee6c7ba84fbc2d5bd61b45cb2fe5eb65aa78',
        'kiss carry display unusual confirm curtain upgrade antique rotate hello void custom frequent obey nut hole price segment',
        'ed56ff6c833c07982eb7119a8f48fd363c4a9b1601cd2de736b01045c5eb8ab4f57b079403485d1c4924f0790dc10a971763337cb9f9c62226f64fff26397c79',
        new Uint8Array([
          214, 3, 23, 1, 252, 1, 114, 7, 119, 1, 177, 1, 117, 7, 79, 0, 225, 5, 86, 3, 172, 7, 180,
          1, 229, 2, 191, 4, 189, 4, 101, 3, 83, 5, 25, 6,
        ]),
      ],
      [
        '4fa1a8bc3e6d80ee1316050e862c1812031493212b7ec3f3bb1b08f168cabeef',
        'exile ask congress lamp submit jacket era scheme attend cousin alcohol catch course end lucky hurt sentence oven short ball bird grab wing top',
        '095ee6f817b4c2cb30a5a797360a81a40ab0f9a4e25ecd672a3f58a0b5ba0687c096a6b14d2c0deb3bdefce4f61d01ae07417d502429352e27695163f7447a8c',
        new Uint8Array([
          125, 2, 106, 0, 120, 1, 230, 3, 192, 6, 184, 3, 98, 2, 5, 6, 116, 0, 139, 1, 48, 0, 32, 1,
          138, 1, 76, 2, 37, 4, 126, 3, 31, 6, 238, 4, 54, 6, 143, 0, 180, 0, 42, 3, 221, 7, 39, 7,
        ]),
      ],
      [
        '18ab19a9f54a9274f03e5209a2ac8a91',
        'board flee heavy tunnel powder denial science ski answer betray cargo cat',
        '6eff1bb21562918509c73cb990260db07c0ce34ff0e3cc4a8cb3276129fbcb300bddfe005831350efd633909f476c45c88253276d9fd0df6ef48609e8bb7dca8',
        new Uint8Array([
          197, 0, 198, 2, 83, 3, 84, 7, 73, 5, 211, 1, 7, 6, 82, 6, 77, 0, 171, 0, 21, 1, 30, 1,
        ]),
      ],
      [
        '18a2e1d81b8ecfb2a333adcb0c17a5b9eb76cc5d05db91a4',
        'board blade invite damage undo sun mimic interest slam gaze truly inherit resist great inject rocket museum chief',
        'f84521c777a13b61564234bf8f8b62b3afce27fc4062b51bb5e62bdfecb23864ee6ecf07c1d5a97c0834307c5c852d8ceb88e7c97923c0a3b496bedd4e5f88a9',
        new Uint8Array([
          197, 0, 184, 0, 176, 3, 184, 1, 103, 7, 202, 6, 102, 4, 173, 3, 88, 6, 5, 3, 75, 7, 158,
          3, 187, 5, 49, 3, 160, 3, 219, 5, 141, 4, 62, 1,
        ]),
      ],
      [
        '15da872c95a13dd738fbf50e427583ad61f18fd99f628c417a61cf8343c90419',
        'beyond stage sleep clip because twist token leaf atom beauty genius food business side grid unable middle armed observe pair crouch tonight away coconut',
        'b15509eaa2d09d3efd3e006ef42151b30367dc6e3aa5e44caba3fe4d3e352e65101fbdb86a96776b91946ff06f8eac594dc6ee1d3e82a42dfe1b40fef6bcc3fd',
        new Uint8Array([
          174, 0, 161, 6, 89, 6, 90, 1, 158, 0, 92, 7, 31, 7, 245, 3, 114, 0, 157, 0, 7, 3, 214, 2,
          248, 0, 63, 6, 51, 3, 98, 7, 98, 4, 94, 0, 195, 4, 248, 4, 161, 1, 36, 7, 131, 0, 103, 1,
        ]),
      ],
    ],
    japanese: [
      [
        '00000000000000000000000000000000',
        'あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あおぞら',
        'a262d6fb6122ecf45be09c50492b31f92e9beb7d9a845987a02cefda57a15f9c467a17872029a9e92299b5cbdf306e3a0ee620245cbd508959b6cb7ca637bd55',
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　やちん　そつう　れきだい　ほんやく　わかめ',
        'aee025cbe6ca256862f889e48110a6a382365142f7d16f2b9545285b3af64e542143a577e9c144e101a6bdca18f8d97ec3366ebf5b088b1c1af9bc31346e60d9',
      ],
      [
        '80808080808080808080808080808080',
        'そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　いよく　そとづら　あまど　おおう　あかちゃん',
        'e51736736ebdf77eda23fa17e31475fa1d9509c78f1deb6b4aacfbd760a7e2ad769c714352c95143b5c1241985bcb407df36d64e75dd5a2b78ca5d2ba82a3544',
      ],
      [
        'ffffffffffffffffffffffffffffffff',
        'われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　ろんぶん',
        '4cd2ef49b479af5e1efbbd1e0bdc117f6a29b1010211df4f78e2ed40082865793e57949236c43b9fe591ec70e5bb4298b8b71dc4b267bb96ed4ed282c8f7761c',
      ],
      [
        '000000000000000000000000000000000000000000000000',
        'あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あらいぐま',
        'd99e8f1ce2d4288d30b9c815ae981edd923c01aa4ffdc5dee1ab5fe0d4a3e13966023324d119105aff266dac32e5cd11431eeca23bbd7202ff423f30d6776d69',
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　やちん　そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　やちん　そつう　れいぎ',
        'eaaf171efa5de4838c758a93d6c86d2677d4ccda4a064a7136344e975f91fe61340ec8a615464b461d67baaf12b62ab5e742f944c7bd4ab6c341fbafba435716',
      ],
      [
        '808080808080808080808080808080808080808080808080',
        'そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　いよく　そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　いよく　そとづら　いきなり',
        'aec0f8d3167a10683374c222e6e632f2940c0826587ea0a73ac5d0493b6a632590179a6538287641a9fc9df8e6f24e01bf1be548e1f74fd7407ccd72ecebe425',
      ],
      [
        'ffffffffffffffffffffffffffffffffffffffffffffffff',
        'われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　りんご',
        'f0f738128a65b8d1854d68de50ed97ac1831fc3a978c569e415bbcb431a6a671d4377e3b56abd518daa861676c4da75a19ccb41e00c37d086941e471a4374b95',
      ],
      [
        '0000000000000000000000000000000000000000000000000000000000000000',
        'あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　あいこくしん　いってい',
        '23f500eec4a563bf90cfda87b3e590b211b959985c555d17e88f46f7183590cd5793458b094a4dccc8f05807ec7bd2d19ce269e20568936a751f6f1ec7c14ddd',
      ],
      [
        '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
        'そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　やちん　そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　やちん　そつう　れきだい　ほんやく　わかす　りくつ　ばいか　ろせん　まんきつ',
        'cd354a40aa2e241e8f306b3b752781b70dfd1c69190e510bc1297a9c5738e833bcdc179e81707d57263fb7564466f73d30bf979725ff783fb3eb4baa86560b05',
      ],
      [
        '8080808080808080808080808080808080808080808080808080808080808080',
        'そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　いよく　そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　いよく　そとづら　あまど　おおう　あこがれる　いくぶん　けいけん　あたえる　うめる',
        '6b7cd1b2cdfeeef8615077cadd6a0625f417f287652991c80206dbd82db17bf317d5c50a80bd9edd836b39daa1b6973359944c46d3fcc0129198dc7dc5cd0e68',
      ],
      [
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        'われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　われる　らいう',
        'a44ba7054ac2f9226929d56505a51e13acdaa8a9097923ca07ea465c4c7e294c038f3f4e7e4b373726ba0057191aced6e48ac8d183f3a11569c426f0de414623',
      ],
      [
        '77c2b00716cec7213839159e404db50d',
        'せまい　うちがわ　あずき　かろう　めずらしい　だんち　ますく　おさめる　ていぼう　あたる　すあな　えしゃく',
        '344cef9efc37d0cb36d89def03d09144dd51167923487eec42c487f7428908546fa31a3c26b7391a2b3afe7db81b9f8c5007336b58e269ea0bd10749a87e0193',
      ],
      [
        'b63a9c59a6e641f288ebc103017f1da9f8290b3da6bdef7b',
        'ぬすむ　ふっかつ　うどん　こうりつ　しつじ　りょうり　おたがい　せもたれ　あつめる　いちりゅう　はんしゃ　ごますり　そんけい　たいちょう　らしんばん　ぶんせき　やすみ　ほいく',
        'b14e7d35904cb8569af0d6a016cee7066335a21c1c67891b01b83033cadb3e8a034a726e3909139ecd8b2eb9e9b05245684558f329b38480e262c1d6bc20ecc4',
      ],
      [
        '3e141609b97933b66a060dcddc71fad1d91677db872031e85f4c015c5e7e8982',
        'くのう　てぬぐい　そんかい　すろっと　ちきゅう　ほあん　とさか　はくしゅ　ひびく　みえる　そざい　てんすう　たんぴん　くしょう　すいようび　みけん　きさらぎ　げざん　ふくざつ　あつかう　はやい　くろう　おやゆび　こすう',
        '32e78dce2aff5db25aa7a4a32b493b5d10b4089923f3320c8b287a77e512455443298351beb3f7eb2390c4662a2e566eec5217e1a37467af43b46668d515e41b',
      ],
      [
        '0460ef47585604c5660618db2e6a7e7f',
        'あみもの　いきおい　ふいうち　にげる　ざんしょ　じかん　ついか　はたん　ほあん　すんぽう　てちがい　わかめ',
        '0acf902cd391e30f3f5cb0605d72a4c849342f62bd6a360298c7013d714d7e58ddf9c7fdf141d0949f17a2c9c37ced1d8cb2edabab97c4199b142c829850154b',
      ],
      [
        '72f60ebac5dd8add8d2a25a797102c3ce21bc029c200076f',
        'すろっと　にくしみ　なやむ　たとえる　へいこう　すくう　きない　けってい　とくべつ　ねっしん　いたみ　せんせい　おくりがな　まかい　とくい　けあな　いきおい　そそぐ',
        '9869e220bec09b6f0c0011f46e1f9032b269f096344028f5006a6e69ea5b0b8afabbb6944a23e11ebd021f182dd056d96e4e3657df241ca40babda532d364f73',
      ],
      [
        '2c85efc7f24ee4573d2b81a6ec66cee209b2dcbd09d8eddc51e0215b0b68e416',
        'かほご　きうい　ゆたか　みすえる　もらう　がっこう　よそう　ずっと　ときどき　したうけ　にんか　はっこう　つみき　すうじつ　よけい　くげん　もくてき　まわり　せめる　げざい　にげる　にんたい　たんそく　ほそく',
        '713b7e70c9fbc18c831bfd1f03302422822c3727a93a5efb9659bec6ad8d6f2c1b5c8ed8b0b77775feaf606e9d1cc0a84ac416a85514ad59f5541ff5e0382481',
      ],
      [
        'eaebabb2383351fd31d703840b32e9e2',
        'めいえん　さのう　めだつ　すてる　きぬごし　ろんぱ　はんこ　まける　たいおう　さかいし　ねんいり　はぶらし',
        '06e1d5289a97bcc95cb4a6360719131a786aba057d8efd603a547bd254261c2a97fcd3e8a4e766d5416437e956b388336d36c7ad2dba4ee6796f0249b10ee961',
      ],
      [
        '7ac45cfe7722ee6c7ba84fbc2d5bd61b45cb2fe5eb65aa78',
        'せんぱい　おしえる　ぐんかん　もらう　きあい　きぼう　やおや　いせえび　のいず　じゅしん　よゆう　きみつ　さといも　ちんもく　ちわわ　しんせいじ　とめる　はちみつ',
        '1fef28785d08cbf41d7a20a3a6891043395779ed74503a5652760ee8c24dfe60972105ee71d5168071a35ab7b5bd2f8831f75488078a90f0926c8e9171b2bc4a',
      ],
      [
        '4fa1a8bc3e6d80ee1316050e862c1812031493212b7ec3f3bb1b08f168cabeef',
        'こころ　いどう　きあつ　そうがんきょう　へいあん　せつりつ　ごうせい　はいち　いびき　きこく　あんい　おちつく　きこえる　けんとう　たいこ　すすめる　はっけん　ていど　はんおん　いんさつ　うなぎ　しねま　れいぼう　みつかる',
        '43de99b502e152d4c198542624511db3007c8f8f126a30818e856b2d8a20400d29e7a7e3fdd21f909e23be5e3c8d9aee3a739b0b65041ff0b8637276703f65c2',
      ],
      [
        '18ab19a9f54a9274f03e5209a2ac8a91',
        'うりきれ　さいせい　じゆう　むろん　とどける　ぐうたら　はいれつ　ひけつ　いずれ　うちあわせ　おさめる　おたく',
        '3d711f075ee44d8b535bb4561ad76d7d5350ea0b1f5d2eac054e869ff7963cdce9581097a477d697a2a9433a0c6884bea10a2193647677977c9820dd0921cbde',
      ],
      [
        '18a2e1d81b8ecfb2a333adcb0c17a5b9eb76cc5d05db91a4',
        'うりきれ　うねる　せっさたくま　きもち　めんきょ　へいたく　たまご　ぜっく　びじゅつかん　さんそ　むせる　せいじ　ねくたい　しはらい　せおう　ねんど　たんまつ　がいけん',
        '753ec9e333e616e9471482b4b70a18d413241f1e335c65cd7996f32b66cf95546612c51dcf12ead6f805f9ee3d965846b894ae99b24204954be80810d292fcdd',
      ],
      [
        '15da872c95a13dd738fbf50e427583ad61f18fd99f628c417a61cf8343c90419',
        'うちゅう　ふそく　ひしょ　がちょう　うけもつ　めいそう　みかん　そざい　いばる　うけとる　さんま　さこつ　おうさま　ぱんつ　しひょう　めした　たはつ　いちぶ　つうじょう　てさぎょう　きつね　みすえる　いりぐち　かめれおん',
        '346b7321d8c04f6f37b49fdf062a2fddc8e1bf8f1d33171b65074531ec546d1d3469974beccb1a09263440fc92e1042580a557fdce314e27ee4eabb25fa5e5fe',
      ],
    ],
  };
  describe('BIP39-lib vectors', () => {
    function testVector(
      description: string,
      wordlist: string[],
      password: string,
      v: [string, string, string, Uint8Array?],
      i: number
    ) {
      let [entropy, mnemonic, seed, mnemonicAsUint8Array] = v;
      if (!mnemonicAsUint8Array) {
        const indices = mnemonic.split('　').map((word) => wordlist.indexOf(word));
        mnemonicAsUint8Array = new Uint8Array(new Uint16Array(indices).buffer);
      }
      it(`for ${description} (${i}), ${entropy}`, async () => {
        await deepStrictEqual(
          toHex(mnemonicToEntropy(mnemonic, wordlist)),
          entropy,
          'mnemonicToEntropy'
        );
        await deepStrictEqual(
          toHex(mnemonicToSeedSync(mnemonic, wordlist, password)),
          seed,
          'mnemonicToSeedSync'
        );
        const res = await mnemonicToSeed(mnemonic, password);
        await deepStrictEqual(toHex(res), seed, 'mnemonicToSeed');
        await deepStrictEqual(
          entropyToMnemonic(hexToBytes(entropy), wordlist),
          mnemonicAsUint8Array,
          'entropyToMnemonic'
        );
        await deepStrictEqual(validateMnemonic(mnemonic, wordlist), true, 'validateMnemonic');
      });
    }
    for (let i = 0; i < VECTORS.english.length; i++) {
      testVector('English', englishWordlist, 'TREZOR', VECTORS.english[i], i);
    }
    for (let i = 0; i < VECTORS.japanese.length; i++) {
      testVector(
        'Japanese',
        japaneseWordlist,
        '㍍ガバヴァぱばぐゞちぢ十人十色',
        VECTORS.japanese[i],
        i
      );
    }
    it('Invalid entropy', () => {
      throws(() => entropyToMnemonic(new Uint8Array([]), englishWordlist));
      throws(() => entropyToMnemonic(new Uint8Array([0, 0, 0]), englishWordlist));
      throws(() => entropyToMnemonic(new Uint8Array(1028), englishWordlist));
    });
    it('UTF8 passwords', async () => {
      for (const [_, mnemonic, seed] of VECTORS.japanese) {
        const password = '㍍ガバヴァぱばぐゞちぢ十人十色';
        const normalizedPassword = 'メートルガバヴァぱばぐゞちぢ十人十色';
        await deepStrictEqual(
          toHex(mnemonicToSeedSync(mnemonic, japaneseWordlist, password)),
          seed,
          'mnemonicToSeedSync normalizes passwords'
        );
        await deepStrictEqual(
          toHex(mnemonicToSeedSync(mnemonic, japaneseWordlist, normalizedPassword)),
          seed,
          'mnemonicToSeedSync leaves normalizes passwords as-is'
        );
      }
    });
    it('generateMnemonic can vary entropy length', async () => {
      const mnemonicAsUint8 = generateMnemonic(englishWordlist, 160);
      const recoveredIndices = Array.from(new Uint16Array(mnemonicAsUint8.buffer));

      const mnemonicAsArray = recoveredIndices.map((i) => englishWordlist[i]);

      await deepStrictEqual(mnemonicAsArray.length, 15, 'can vary generated entropy bit length');
    });
    it('validateMnemonic', async () => {
      await deepStrictEqual(
        validateMnemonic('sleep kitten', englishWordlist),
        false,
        'fails for a mnemonic that is too short'
      );
      await deepStrictEqual(
        validateMnemonic('sleep kitten sleep kitten sleep kitten', englishWordlist),
        false,
        'fails for a mnemonic that is too short'
      );
      await deepStrictEqual(
        validateMnemonic(
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about end grace oxygen maze bright face loan ticket trial leg cruel lizard bread worry reject journey perfect chef section caught neither install industry',
          englishWordlist
        ),
        false,
        'fails for a mnemonic that is too long'
      );
      await deepStrictEqual(
        validateMnemonic(
          'turtle front uncle idea crush write shrug there lottery flower risky shell',
          englishWordlist
        ),
        false,
        'fails if mnemonic words are not in the word list'
      );
      await deepStrictEqual(
        validateMnemonic(
          'sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten sleep kitten',
          englishWordlist
        ),
        false,
        'fails for invalid checksum'
      );
    });
  });
});
