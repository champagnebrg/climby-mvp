# Firebase deploy

## Firestore indexes
Per deployare anche gli indici definiti in `firestore.indexes.json`:

```bash
npm run deploy:indexes
```

Se vuoi deployare insieme rules + indexes Firestore:

```bash
npm run deploy:firestore
```
