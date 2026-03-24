# Firebase deploy

## Firestore indexes
Deploy dev:

```bash
npm run deploy:indexes:dev
```

Deploy prod:

```bash
npm run deploy:indexes:prod
```

## Firestore rules + indexes
Deploy dev:

```bash
npm run deploy:firestore:dev
```

Deploy prod:

```bash
npm run deploy:firestore:prod
```

## Compatibilità script esistenti
I vecchi comandi restano disponibili e puntano a DEV con target esplicito:

```bash
npm run deploy:indexes
npm run deploy:firestore
```

> Prima del primo deploy prod: sostituisci `__SET_PROD_PROJECT_ID__` in `package.json`.
