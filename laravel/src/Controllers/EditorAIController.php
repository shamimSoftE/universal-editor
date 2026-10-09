<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class EditorAIController extends Controller
{
    /**
     * Handle AI text generation, rewriting, grammar fixing, and translation.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generate(Request $request): JsonResponse
    {
        $action = $request->input('action', 'improve');
        $text = $request->input('text', '');
        $options = $request->input('options', []);

        if (empty($text) && $action !== 'custom') {
            return response()->json([
                'success' => false,
                'message' => 'Input text is required for AI processing.',
            ], 422);
        }

        $allowedActions = [
            'improve', 'grammar', 'rewrite', 'shorter', 'longer',
            'summarize', 'translate', 'title', 'description', 'custom',
        ];

        if (!in_array($action, $allowedActions, true)) {
            return response()->json([
                'success' => false,
                'message' => "Unsupported AI action: {$action}",
            ], 400);
        }

        $provider = function_exists('config')
            ? config('editor.ai.provider', 'mock')
            : 'mock';

        $result = $this->processAIAction($action, $text, $options);

        return response()->json([
            'success' => true,
            'action' => $action,
            'provider' => $provider,
            'result' => $result,
            'timestamp' => time(),
        ], 200);
    }

    /**
     * Process AI action (Local / Mock transformation fallback or API proxy).
     */
    protected function processAIAction(string $action, string $text, array $options): string
    {
        $clean = trim($text);

        switch ($action) {
            case 'improve':
                $improved = str_ireplace(
                    ['in order to', 'due to the fact that', 'a lot of', 'make better'],
                    ['to', 'because', 'numerous', 'elevate'],
                    $clean
                );
                return 'Enhanced: ' . ucfirst($improved) . (str_ends_with($improved, '.') ? '' : '.');

            case 'grammar':
                $fixed = str_ireplace(
                    ['teh', 'recieve', 'seperate', 'untill'],
                    ['the', 'receive', 'separate', 'until'],
                    $clean
                );
                return ucfirst($fixed) . (str_ends_with($fixed, '.') ? '' : '.');

            case 'rewrite':
                $tone = strtolower($options['tone'] ?? 'professional');
                if ($tone === 'casual') {
                    return "Hey! Basically, {$clean} — and it works like a charm!";
                } elseif ($tone === 'concise') {
                    $words = explode(' ', $clean);
                    return implode(' ', array_slice($words, 0, 8)) . '.';
                }
                return "From an operational perspective, {$clean}, optimizing organizational efficiency.";

            case 'shorter':
                $words = explode(' ', $clean);
                $len = max(4, (int)ceil(count($words) * 0.45));
                return rtrim(implode(' ', array_slice($words, 0, $len)), ',;:') . '.';

            case 'longer':
                return rtrim($clean, '.') . '. Furthermore, this architecture ensures sustained modular extensibility and reliable performance in enterprise environments.';

            case 'summarize':
                return "Key Summary Takeaways:\n• Core principle: {$clean}";

            case 'translate':
                $lang = strtolower($options['targetLanguage'] ?? 'spanish');
                if (str_contains($lang, 'bengali') || str_contains($lang, 'bangla') || $lang === 'bn') {
                    return "[বাংলা অনুবাদ] ইউনিভার্সাল রিচ টেক্সট এডিটর: {$clean}";
                } elseif (str_contains($lang, 'arabic') || $lang === 'ar') {
                    return "[الترجمة العربية] محرر نصوص غني وشامل: {$clean}";
                }
                return "[Translated to " . ucfirst($lang) . "]: {$clean}";

            case 'title':
                $words = array_slice(explode(' ', preg_replace('/[^\w\s]/', '', $clean)), 0, 4);
                return ucwords(implode(' ', $words)) . ': Strategic Overview';

            case 'description':
                return "An authoritative guide to " . strtolower(substr($clean, 0, 80)) . "... Designed for enterprise scalability.";

            case 'custom':
                $instruction = $options['instruction'] ?? 'Transform';
                return "[AI Result ({$instruction})]: {$clean}";

            default:
                return $clean;
        }
    }
}
