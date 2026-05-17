<?php

namespace App\Security\Voter;

use App\Entity\Usuario;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

class UsuarioVoter extends Voter
{
    public const EDIT = 'USUARIO_EDIT';
    public const VIEW = 'USUARIO_VIEW';

    protected function supports(string $attribute, mixed $subject): bool
    {
        // Solo votamos sobre atributos definidos y sujetos de tipo Usuario
        return in_array($attribute, [self::EDIT, self::VIEW])
            && $subject instanceof Usuario;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?\Symfony\Component\Security\Core\Authorization\Voter\Vote $vote = null): bool
    {
        $user = $token->getUser();
        // Si el usuario no está autenticado, denegar acceso
        if (!$user instanceof UserInterface) {
            return false;
        }

        $targetUser = $subject;

        // Un administrador siempre puede editar y ver cualquier usuario
        if (in_array('ROLE_ADMIN', $user->getRoles())) {
            return true;
        }

        switch ($attribute) {
            case self::EDIT:
            case self::VIEW:
                // Un usuario solo puede editar o ver sus propios datos
                return $user->getUserIdentifier() === $targetUser->getUserIdentifier();
        }

        return false;
    }
}
