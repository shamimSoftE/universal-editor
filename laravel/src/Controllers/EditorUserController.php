<?php

namespace UniversalEditor\Laravel\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class EditorUserController extends Controller
{
    /**
     * Sample team directory for Mentions system.
     * In full production deployments, this can query the Eloquent User model or external auth directory.
     */
    protected static array $defaultUsers = [
        [
            'id' => 1,
            'name' => 'Shamim Reza',
            'username' => 'shamim',
            'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            'email' => 'shamim@linktechbd.com',
            'role' => 'Lead Architect',
            'badge' => 'Owner',
        ],
        [
            'id' => 2,
            'name' => 'John Doe',
            'username' => 'johndoe',
            'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            'email' => 'john.doe@example.com',
            'role' => 'Full-Stack Engineer',
            'badge' => 'Core Team',
        ],
        [
            'id' => 3,
            'name' => 'Jane Smith',
            'username' => 'janesmith',
            'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            'email' => 'jane.smith@example.com',
            'role' => 'Product Designer',
            'badge' => 'UI/UX',
        ],
        [
            'id' => 4,
            'name' => 'Alex Johnson',
            'username' => 'alex',
            'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
            'email' => 'alex.j@example.com',
            'role' => 'Security Engineer',
            'badge' => 'Infra',
        ],
        [
            'id' => 5,
            'name' => 'Sarah Connor',
            'username' => 'sarah',
            'avatar' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
            'email' => 'sarah.c@example.com',
            'role' => 'QA Lead',
            'badge' => 'Automation',
        ],
        [
            'id' => 6,
            'name' => 'Michael Brown',
            'username' => 'michael',
            'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
            'email' => 'michael.b@example.com',
            'role' => 'Backend Developer',
            'badge' => 'Laravel',
        ],
        [
            'id' => 7,
            'name' => 'Emily Davis',
            'username' => 'emily',
            'avatar' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            'email' => 'emily.d@example.com',
            'role' => 'Frontend Specialist',
            'badge' => 'Vue 3',
        ],
        [
            'id' => 8,
            'name' => 'David Wilson',
            'username' => 'david',
            'avatar' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
            'email' => 'david.w@example.com',
            'role' => 'DevOps Specialist',
            'badge' => 'SRE',
        ],
    ];

    /**
     * Search users for mentions autocomplete.
     *
     * Route: GET /api/users/search?q={query}
     * or: GET /api/editor/users/search?q={query}
     */
    public function search(Request $request): JsonResponse
    {
        $rawQuery = (string) $request->input('q', '');
        $query = ltrim(trim($rawQuery), '@');
        $limit = max(1, min(50, (int) $request->input('limit', 10)));

        $users = static::filterUsers($query, $limit);

        return response()->json($users);
    }

    /**
     * Filter user list by query matching name, username, email, or role.
     */
    public static function filterUsers(string $query, int $limit = 10): array
    {
        $cleanQuery = strtolower(trim($query));

        if ($cleanQuery === '') {
            return array_slice(static::$defaultUsers, 0, $limit);
        }

        $results = [];
        foreach (static::$defaultUsers as $user) {
            $nameMatch = str_contains(strtolower($user['name']), $cleanQuery);
            $usernameMatch = str_contains(strtolower($user['username']), $cleanQuery);
            $emailMatch = isset($user['email']) && str_contains(strtolower($user['email']), $cleanQuery);
            $roleMatch = isset($user['role']) && str_contains(strtolower($user['role']), $cleanQuery);

            if ($nameMatch || $usernameMatch || $emailMatch || $roleMatch) {
                $results[] = $user;
                if (count($results) >= $limit) {
                    break;
                }
            }
        }

        return $results;
    }
}
