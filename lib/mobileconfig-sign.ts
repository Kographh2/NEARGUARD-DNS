import forge from "node-forge";

import { PROFILE_ORGANIZATION, PROFILE_SIGNER_NAME } from "@/lib/mobileconfig";

interface Signer {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.rsa.PrivateKey;
}

let signerPromise: Promise<Signer> | null = null;

async function createSigner(): Promise<Signer> {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const certificate = forge.pki.createCertificate();
  certificate.publicKey = keys.publicKey;
  certificate.serialNumber = forge.util.bytesToHex(
    forge.random.getBytesSync(16),
  );
  certificate.validity.notBefore = new Date("2024-01-01T00:00:00Z");
  certificate.validity.notAfter = new Date("2044-01-01T00:00:00Z");
  certificate.setSubject([
    { name: "commonName", value: PROFILE_SIGNER_NAME },
    { name: "organizationName", value: PROFILE_ORGANIZATION },
    { name: "countryName", value: "ID" },
  ]);
  certificate.setIssuer(certificate.subject.attributes);
  certificate.setExtensions([
    { name: "basicConstraints", cA: false },
    {
      name: "keyUsage",
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: false,
      dataEncipherment: false,
    },
  ]);
  certificate.sign(keys.privateKey, forge.md.sha256.create());

  return { certificate, privateKey: keys.privateKey };
}

function getSigner(): Promise<Signer> {
  if (!signerPromise) {
    signerPromise = createSigner().catch((error: unknown) => {
      signerPromise = null;
      throw error;
    });
  }
  return signerPromise;
}

export async function signMobileConfig(xml: string): Promise<Uint8Array> {
  const signer = await getSigner();
  const content = Buffer.from(xml, "utf8").toString("binary");
  const signedData = forge.pkcs7.createSignedData();
  signedData.content = forge.util.createBuffer(content);
  signedData.addCertificate(signer.certificate);
  signedData.addSigner({
    key: signer.privateKey,
    certificate: signer.certificate,
    digestAlgorithm: forge.pki.oids.sha256 ?? "sha256",
  });
  signedData.sign({ detached: false });
  const der = forge.asn1.toDer(signedData.toAsn1()).getBytes();
  return new Uint8Array(Buffer.from(der, "binary"));
}
