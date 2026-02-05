package com.tarot.app;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class App {
    public static void main(String[] args) {
        try {
            System.out.println("🔮 歡迎來到 AI 塔羅占卜系統...");
            
            // 1. 讀取 resources 下的 JSON 資料
            Gson gson = new Gson();
            InputStreamReader reader = new InputStreamReader(
                App.class.getResourceAsStream("/data/major_arcana.json"), 
                StandardCharsets.UTF_8
            );
            JsonObject data = gson.fromJson(reader, JsonObject.class);
            JsonArray cards = data.getAsJsonArray("major_arcana");

            // 2. 模擬用戶問題與聖三角抽牌
            String userQuestion = "我最近的學業運勢如何？"; // 你可以改成從 Scanner 輸入
            System.out.println("你的問題：" + userQuestion);
            
            List<Integer> indices = new ArrayList<>();
            for (int i = 0; i < cards.size(); i++) indices.add(i);
            Collections.shuffle(indices);
            
            String[] positions = {"過去", "現在", "未來"};
            Random random = new Random();
            StringBuilder promptBuilder = new StringBuilder();
            
            promptBuilder.append("請幫我進行塔羅占卜，用戶的問題是：「").append(userQuestion).append("」\n");
            promptBuilder.append("請根據以下抽出的聖三角牌陣，結合各牌的牌義細節，提供深入且專業的分析與行動建議：\n\n");

            System.out.println("\n--- 🎴 抽牌結果 ---");
            for (int i = 0; i < 3; i++) {
                int cardIdx = indices.get(i);
                JsonObject card = cards.get(cardIdx).getAsJsonObject();
                
                // 隨機決定正逆位
                boolean isUpright = random.nextBoolean();
                String status = isUpright ? "upright" : "reversed";
                String statusText = isUpright ? "正位" : "逆位";

                System.out.println(positions[i] + ": " + card.get("name").getAsString() + " [" + statusText + "]");

                // 從 JSON 提取該牌位的詳細定義
                JsonObject meaning = card.getAsJsonObject(status);
                promptBuilder.append(String.format("- 【%s】位：抽到「%s」%s。其核心牌義為：%s\n", 
                    positions[i], card.get("name").getAsString(), statusText, meaning.get("core").getAsString()));
            }

            // 3. 呼叫 AIService 進行解牌
            System.out.println("\n⏳ AI 正在深度解牌中，請稍候...");
            
            AIService aiService = new AIService();
            String aiResponse = aiService.getTarotInterpretation(promptBuilder.toString());

            System.out.println("\n--- 🌟 AI 專業解牌建議 ---");
            System.out.println(aiResponse);

        } catch (Exception e) {
            System.err.println("❌ 系統發生錯誤：" + e.getMessage());
            e.printStackTrace();
        }
    }
}