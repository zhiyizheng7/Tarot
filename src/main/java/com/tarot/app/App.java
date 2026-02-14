package com.tarot.app;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.Scanner;

public class App {
    private static final String CARD_DATA_PATH = "/data/major_arcana.json";
    private static final String[] POSITIONS = {"過去", "現在", "未來"};
    private static final int DRAW_COUNT = 3;

    public static void main(String[] args) {
        try {
            System.out.println("🔮 歡迎來到 AI 塔羅占卜系統...");

            JsonArray cards = loadMajorArcana(new Gson());
            Random random = new Random();

            try (
                AIService aiService = new AIService();
                Scanner scanner = new Scanner(System.in, StandardCharsets.UTF_8)
            ) {
                while (true) {
                    String userQuestion = readUserQuestion(scanner);
                    System.out.println("你的問題：" + userQuestion);

                    String prompt = buildPrompt(userQuestion, cards, random);

                    // 3. 呼叫 AIService 進行解牌
                    System.out.println("\n⏳ AI 正在深度解牌中，請稍候...");
                    String aiResponse;
                    try {
                        aiResponse = aiService.getTarotInterpretation(prompt);
                    } catch (IOException e) {
                        System.err.println("❌ 連結星際能量失敗，請重新翻牌。");
                        System.err.println("詳細錯誤：" + e.getMessage());
                        if (!askForAnotherRound(scanner)) {
                            System.out.println("🙏 感謝使用，祝你順心。");
                            break;
                        }
                        continue;
                    }

                    System.out.println("\n--- 🌟 AI 專業解牌建議 ---");
                    System.out.println(aiResponse);

                    if (!askForAnotherRound(scanner)) {
                        System.out.println("🙏 感謝使用，祝你順心。");
                        break;
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("❌ 系統發生錯誤：" + e.getMessage());
            e.printStackTrace();
        }
    }

    private static JsonArray loadMajorArcana(Gson gson) throws IOException {
        InputStream stream = App.class.getResourceAsStream(CARD_DATA_PATH);
        if (stream == null) {
            throw new IOException("找不到牌組資料檔案：" + CARD_DATA_PATH);
        }

        try (InputStreamReader reader = new InputStreamReader(stream, StandardCharsets.UTF_8)) {
            JsonObject data = gson.fromJson(reader, JsonObject.class);
            if (data == null || !data.has("major_arcana") || !data.get("major_arcana").isJsonArray()) {
                throw new JsonParseException("牌組資料格式錯誤：缺少 major_arcana 陣列");
            }

            JsonArray cards = data.getAsJsonArray("major_arcana");
            if (cards.size() < DRAW_COUNT) {
                throw new JsonParseException("牌組資料不足，至少需要 " + DRAW_COUNT + " 張牌");
            }
            return cards;
        }
    }

    private static String buildPrompt(String userQuestion, JsonArray cards, Random random) {
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < cards.size(); i++) {
            indices.add(i);
        }
        Collections.shuffle(indices, random);

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("請幫我進行塔羅占卜，用戶的問題是：「").append(userQuestion).append("」\n");
        promptBuilder.append("請根據以下抽出的聖三角牌陣，結合各牌的牌義細節，提供深入且專業的分析與行動建議：\n\n");

        System.out.println("\n--- 🎴 抽牌結果 ---");
        for (int i = 0; i < DRAW_COUNT; i++) {
            int cardIdx = indices.get(i);
            JsonObject card = cards.get(cardIdx).getAsJsonObject();

            boolean isUpright = random.nextBoolean();
            String status = isUpright ? "upright" : "reversed";
            String statusText = isUpright ? "正位" : "逆位";
            String cardName = card.get("name").getAsString();

            System.out.println(POSITIONS[i] + ": " + cardName + " [" + statusText + "]");

            JsonObject meaning = card.getAsJsonObject(status);
            if (meaning == null || !meaning.has("core")) {
                throw new IllegalStateException("牌義資料缺失：" + cardName + " (" + status + ")");
            }
            promptBuilder.append(String.format("- 【%s】位：抽到「%s」%s。其核心牌義為：%s\n",
                POSITIONS[i], cardName, statusText, meaning.get("core").getAsString()));
        }

        return promptBuilder.toString();
    }

    private static String readUserQuestion(Scanner scanner) {
        while (true) {
            System.out.print("\n請輸入你想占卜的問題：");
            String question = scanner.nextLine().trim();
            if (!question.isEmpty()) {
                return question;
            }
            System.out.println("⚠️ 問題不可為空，請重新輸入。");
        }
    }

    private static boolean askForAnotherRound(Scanner scanner) {
        while (true) {
            System.out.print("\n是否要再占卜一次？(y/n)：");
            String answer = scanner.nextLine().trim().toLowerCase();
            if ("y".equals(answer) || "yes".equals(answer)) {
                return true;
            }
            if ("n".equals(answer) || "no".equals(answer)) {
                return false;
            }
            System.out.println("⚠️ 請輸入 y 或 n。");
        }
    }
}
