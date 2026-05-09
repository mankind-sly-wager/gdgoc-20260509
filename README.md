# TOEIC Study Planner

TOEICの現在スコア、目標スコア、試験日、1日の学習時間から、毎日の学習タスクを作成するNext.js 16アプリです。Stitchで作成した日本語UIをベースに、タスク、メモ、分析、設定を1つのCloud Run向けアプリに統合しています。

## Live Demo

https://toeic-study-planner-l5cazekdoq-an.a.run.app

## Credits

feat. yukiさん, tomokiさん

## Design Specification

Stitchで作成した仕様書と画面案は `docs/stitch/stitch_toeic_study_planner/` に展開しています。

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data Storage

学習データはブラウザのlocalStorageに保存します。

- Storage key: `toeicState`
- Server database: none
- Authentication: none

Cloud Runのコンテナはステートレスに保ち、ユーザーごとの学習データは各ブラウザに残ります。

## Build And Run Container Locally

```bash
npm run lint
npm run build
docker build -t toeic-study-planner .
docker run --rm -p 8080:8080 -e PORT=8080 toeic-study-planner
```

Open http://localhost:8080.

## Deploy To Google Cloud Run

Install and initialize the Google Cloud CLI first:

- Google Cloud CLI install guide: https://docs.cloud.google.com/sdk/docs/install-sdk?hl=ja
- Cloud Run deploy guide: https://docs.cloud.google.com/run/docs/deploying

Login and choose your project:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

Enable the required APIs:

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

Create the Artifact Registry repository once:

```bash
gcloud artifacts repositories create cloud-run \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Cloud Run container images"
```

Build and deploy with Cloud Build:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=toeic-study-planner,_REGION=asia-northeast1,_REPOSITORY=cloud-run
```

The Cloud Build config builds the Docker image, pushes it to Artifact Registry, and deploys it to Cloud Run with unauthenticated access enabled on port 8080.
