<?php

namespace App\Security;

use Lexik\Bundle\JWTAuthenticationBundle\Security\Authenticator\JwtAuthenticator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

/*
Autenticador JWT personalizado para Symfony 8.0+ Security.
Encargado de:
- Extraer el token JWT de la cabecera Authorization
- Validar el token mediante LexikJWTAuthenticationBundle
- Obtener el usuario autenticado
- Manejar errores de autenticación
Se integra con security.yaml y funciona con el firewall 'api'.
Todos los endpoints en /api (excepto los públicos) requieren un JWT válido.
*/
class AutenticadorJwt extends JwtAuthenticator
{
    /*
    Determina si este autenticador debe procesar la solicitud actual.
    Solo procesa solicitudes que tengan un token JWT en la cabecera Authorization.
    */
    public function supports(Request $request): bool
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader) {
            return false;
        }

        return str_starts_with($authHeader, 'Bearer ');
    }

    // Extrae el token JWT de la cabecera Authorization.
    public function getCredentials(Request $request): ?string
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader) {
            return null;
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        return substr($authHeader, 7); // Elimina "Bearer "
    }

    // Maneja errores de autenticación devolviendo una respuesta JSON consistente.
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): \Symfony\Component\HttpFoundation\JsonResponse
    {
        return new \Symfony\Component\HttpFoundation\JsonResponse(
            [
                'error' => 'Autenticación fallida',
                'mensaje' => $exception->getMessageKey(),
            ],
            \Symfony\Component\HttpFoundation\Response::HTTP_UNAUTHORIZED
        );
    }
}
