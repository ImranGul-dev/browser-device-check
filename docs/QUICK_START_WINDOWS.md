# Quick Start on Windows

Open the extracted project folder in Visual Studio Code and choose **Terminal > New Terminal**.

## Install and run

```powershell
node -v
npm -v
npm install
npm run dev
```

Open `http://localhost:4321` unless Astro prints a different address.

## Create the deployable static build

```powershell
npm run build
```

The deployable website is generated in `dist`.

## Run all checks

```powershell
npx playwright install chromium
npm run qa
```

## Activate the contact form after deployment

1. Visit `https://browserdevicecheck.com/contact/`.
2. Send one test message.
3. Open the FormSubmit activation email sent to `gulimran980@gmail.com`.
4. Confirm the form, then send another test.

## npm registry repair

Use these only when npm cannot reach its registry:

```powershell
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
npm cache verify
npm install --no-audit --no-fund
```
