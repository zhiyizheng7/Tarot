package com.tarot.app;

import io.github.cdimascio.dotenv.Dotenv;
import okhttp3.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.IOException;

public class AIService {
    private final String apiKey;
    private final String apiUrl;
    private final OkHttpClient client;
    private final Gson gson;

    public AIService() {
        Dotenv dotenv = Dotenv.load();
        this.apiKey = dotenv.get("GEMINI_API_KEY");
        this.apiUrl = dotenv.get("GEMINI_API_URL");
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }

    public String getTarotInterpretation(String promptText) throws IOException {
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
            MediaType.get("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
            .url(apiUrl + "?key=" + apiKey)
            .post(body)
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
            
            // 解析回傳的 JSON 抓取解牌文字
            JsonObject resObj = gson.fromJson(response.body().string(), JsonObject.class);
            return resObj.getAsJsonArray("candidates")
                         .get(0).getAsJsonObject()
                         .getAsJsonObject("content")
                         .getAsJsonArray("parts")
                         .get(0).getAsJsonObject()
                         .get("text").getAsString();
        }
    }
}