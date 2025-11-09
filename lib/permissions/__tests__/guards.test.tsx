// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Protected, RequirePermission, RequireRole } from '../guards'
import { AbilityProvider } from '../ability-context'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Permission } from '@/types/multi-tenant.types'

describe('Permission Guards', () => {
  describe('Protected Component', () => {
    it('should render children when user has permission', () => {
      render(
        <AbilityProvider role="owner" customPermissions={[]}>
          <Protected permission="patients.create">
            <div>Protected Content</div>
          </Protected>
        </AbilityProvider>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should not render children when user does not have permission', () => {
      render(
        <AbilityProvider role="observer" customPermissions={[]}>
          <Protected permission="patients.create">
            <div>Protected Content</div>
          </Protected>
        </AbilityProvider>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render fallback when user does not have permission', () => {
      render(
        <AbilityProvider role="observer" customPermissions={[]}>
          <Protected permission="patients.create" fallback={<div>No Access</div>}>
            <div>Protected Content</div>
          </Protected>
        </AbilityProvider>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      expect(screen.getByText('No Access')).toBeInTheDocument()
    })

    it('should work with CASL action/subject format', () => {
      render(
        <AbilityProvider role="owner" customPermissions={[]}>
          <Protected permission={['create', 'Patient']}>
            <div>Protected Content</div>
          </Protected>
        </AbilityProvider>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('RequirePermission Component', () => {
    it('should render children when user has all required permissions', () => {
      render(
        <AbilityProvider role="owner" customPermissions={[]}>
          <RequirePermission permissions={['patients.create', 'patients.update']}>
            <div>Protected Content</div>
          </RequirePermission>
        </AbilityProvider>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should not render children when user does not have all permissions', () => {
      render(
        <AbilityProvider role="nurse" customPermissions={[]}>
          <RequirePermission permissions={['patients.create', 'patients.update']}>
            <div>Protected Content</div>
          </RequirePermission>
        </AbilityProvider>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render children when user has any permission (requireAll=false)', () => {
      render(
        <AbilityProvider role="nurse" customPermissions={[]}>
          <RequirePermission permissions={['patients.create', 'patients.read']} requireAll={false}>
            <div>Protected Content</div>
          </RequirePermission>
        </AbilityProvider>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render fallback when user does not have permissions', () => {
      render(
        <AbilityProvider role="observer" customPermissions={[]}>
          <RequirePermission permissions={['patients.create']} fallback={<div>No Access</div>}>
            <div>Protected Content</div>
          </RequirePermission>
        </AbilityProvider>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      expect(screen.getByText('No Access')).toBeInTheDocument()
    })
  })

  describe('RequireRole Component', () => {
    it('should render children when user has required role', () => {
      render(
        <RequireRole roles={['owner', 'admin']} userRole="owner">
          <div>Admin Content</div>
        </RequireRole>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should not render children when user does not have required role', () => {
      render(
        <RequireRole roles={['owner', 'admin']} userRole="nurse">
          <div>Admin Content</div>
        </RequireRole>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('should render fallback when user does not have required role', () => {
      render(
        <RequireRole roles={['owner', 'admin']} userRole="nurse" fallback={<div>No Access</div>}>
          <div>Admin Content</div>
        </RequireRole>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
      expect(screen.getByText('No Access')).toBeInTheDocument()
    })
  })
})
