package com.tarot.app;

import io.github.cdimascio.dotenv.Dotenv;
import okhttp3.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class AIService implements AutoCloseable {
    private static final String DEFAULT_MODEL = "gemini-2.5-flash";
    private static final String DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash-lite";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final MediaType JSON_MEDIA_TYPE = MediaType.get("application/json; charset=utf-8");
    private final String apiKey;
    private final String primaryApiUrl;
    private final String fallbackApiUrl;
    private final OkHttpClient client;
    private final Gson gson;

    public AIService() {
        Dotenv dotenv = Dotenv.load();
        this.apiKey = requireEnv(dotenv, "GEMINI_API_KEY");
        this.primaryApiUrl = resolveApiUrl(dotenv, "GEMINI_API_URL", "GEMINI_MODEL", DEFAULT_MODEL);
        this.fallbackApiUrl = resolveApiUrl(dotenv, "GEMINI_FALLBACK_API_URL", "GEMINI_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL);
        this.client = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
        this.gson = new Gson();
    }

    public String getTarotInterpretation(String promptText) throws IOException {
        if (promptText == null || promptText.isBlank()) {
            throw new IllegalArgumentException("prompt 不可為空");
        }

        try {
            return callGemini(promptText, primaryApiUrl);
        } catch (IOException primaryError) {
            return callGemini(promptText, fallbackApiUrl);
        }
    }

    private String callGemini(String promptText, String url) throws IOException {
        // 按照 Google API 要求的格式包裝 JSON
        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", promptText);

        JsonArray parts = new JsonArray();
        parts.add(textPart);

        JsonObject contentsObj = new JsonObject();
        contentsObj.add("parts", parts);

        JsonArray contentsArray = new JsonArray();
        contentsArray.add(contentsObj);

        JsonObject root = new JsonObject();
        root.add("contents", contentsArray);

        RequestBody body = RequestBody.create(
            gson.toJson(root), 
            JSON_MEDIA_TYPE
        );

        Request request = new Request.Builder()
            .url(url + "?key=" + apiKey)
            .post(body)
            .build();

        IOException lastError = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            try (Response response = client.newCall(request).execute()) {
                ResponseBody responseBody = response.body();
                String responseText = responseBody == null ? "" : responseBody.string();

                if (!response.isSuccessful()) {
                    throw new IOException("Gemini API 呼叫失敗，HTTP " + response.code() + "：" + responseText);
                }
                if (responseText.isBlank()) {
                    throw new IOException("Gemini API 回傳空內容");
                }

                // 解析回傳的 JSON 抓取解牌文字
                JsonObject resObj = gson.fromJson(responseText, JsonObject.class);
                return extractInterpretationText(resObj);
            } catch (IOException e) {
                lastError = e;
                if (attempt == 2) {
                    break;
                }
                try {
                    Thread.sleep(350L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IOException("請求重試被中斷", ie);
                }
            }
        }

        throw lastError == null ? new IOException("Gemini API 未知錯誤") : lastError;
    }

    private static String requireEnv(Dotenv dotenv, String key) {
        String value = dotenv.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("缺少必要環境變數：" + key);
        }
        return value;
    }

    private static String resolveApiUrl(Dotenv dotenv, String explicitUrlKey, String modelKey, String defaultModel) {
        String explicitUrl = dotenv.get(explicitUrlKey);
        if (explicitUrl != null && !explicitUrl.isBlank()) {
            return explicitUrl;
        }
        String model = dotenv.get(modelKey);
        if (model == null || model.isBlank()) {
            model = defaultModel;
        }
        return BASE_URL + model + ":generateContent";
    }

    private static String extractInterpretationText(JsonObject resObj) throws IOException {
        if (resObj == null || !resObj.has("candidates") || !resObj.get("candidates").isJsonArray()) {
            throw new IOException("Gemini API 回傳格式錯誤：缺少 candidates");
        }

        JsonArray candidates = resObj.getAsJsonArray("candidates");
        if (candidates.isEmpty()) {
            throw new IOException("Gemini API 回傳格式錯誤：candidates 為空");
        }

        JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
        if (!firstCandidate.has("content")) {
            throw new IOException("Gemini API 回傳格式錯誤：缺少 content");
        }

        JsonObject content = firstCandidate.getAsJsonObject("content");
        if (content == null || !content.has("parts") || !content.get("parts").isJsonArray()) {
            throw new IOException("Gemini API 回傳格式錯誤：缺少 parts");
        }

        JsonArray parts = content.getAsJsonArray("parts");
        if (parts.isEmpty()) {
            throw new IOException("Gemini API 回傳格式錯誤：parts 為空");
        }

        JsonObject firstPart = parts.get(0).getAsJsonObject();
        if (!firstPart.has("text")) {
            throw new IOException("Gemini API 回傳格式錯誤：缺少 text");
        }

        return firstPart.get("text").getAsString();
    }

    @Override
    public void close() {
        client.dispatcher().executorService().shutdown();
        client.connectionPool().evictAll();
        Cache cache = client.cache();
        if (cache != null) {
            try {
                cache.close();
            } catch (IOException ignored) {
                // no-op
            }
        }
    }
}
